"""Resolver — selection, dedupe, topological sort, and phase grouping.

This is the deterministic core (SPEC §4). Given a hire and the module
library, it produces a `Plan`: the union of universal + role + account
modules, deduped by id, dependency-sorted, and grouped into ordered phases.

No AI, no I/O beyond reading YAML config.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import yaml

# Canonical phase order (SPEC §3.5). Everything downstream relies on this.
PHASE_ORDER: list[str] = ["day-1", "week-1", "week-2", "week-3-plus"]
PHASE_LABELS: dict[str, str] = {
    "day-1": "Day 1",
    "week-1": "Week 1",
    "week-2": "Week 2",
    "week-3-plus": "Week 3+",
}


@dataclass
class Module:
    """One onboarding topic = one markdown file + metadata (SPEC §8.1)."""

    id: str
    file: str
    phase: str
    order: int
    universal: bool = False
    applies_to: list[str] = field(default_factory=list)
    account_scope: list[str] = field(default_factory=list)
    depends_on: list[str] = field(default_factory=list)
    # Parsed but intentionally unused in Phases 1–4 (AI layer is Phase 5).
    adaptive: bool = False


@dataclass
class Hire:
    """The person we're building a plan for (SPEC §4)."""

    name: str
    role: str
    account: str
    seniority: str
    start_date: str
    # Resolved from config during planning; may stay None -> gap.
    manager: str | None = None
    buddy: str | None = None


@dataclass
class Phase:
    key: str
    label: str
    modules: list[Module]


@dataclass
class Config:
    """Parsed configuration: the full module library plus role/account maps."""

    modules: list[Module]
    roles: dict[str, dict]
    accounts: dict[str, dict]

    @property
    def modules_by_id(self) -> dict[str, Module]:
        return {m.id: m for m in self.modules}


@dataclass
class Plan:
    """The resolved output for one hire."""

    hire: Hire
    selected: list[Module]
    phases: list[Phase]  # always all PHASE_ORDER phases, some possibly empty


class ConfigError(Exception):
    """Raised when configuration cannot be parsed into the expected schema."""


# --------------------------------------------------------------------------- #
# Config loading
# --------------------------------------------------------------------------- #
def _load_yaml(path: Path) -> dict:
    if not path.exists():
        raise ConfigError(f"Config file not found: {path}")
    with path.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    if data is None:
        raise ConfigError(f"Config file is empty: {path}")
    if not isinstance(data, dict):
        raise ConfigError(f"Expected a mapping at the top level of {path}")
    return data


def _parse_module(raw: dict, index: int) -> Module:
    if "id" not in raw:
        raise ConfigError(f"modules[{index}] is missing required field 'id'")
    mid = raw["id"]
    for required in ("file", "phase", "order"):
        if required not in raw:
            raise ConfigError(f"module '{mid}' is missing required field '{required}'")
    if raw["phase"] not in PHASE_ORDER:
        raise ConfigError(
            f"module '{mid}' has invalid phase '{raw['phase']}'. "
            f"Valid phases: {', '.join(PHASE_ORDER)}"
        )
    try:
        order = int(raw["order"])
    except (TypeError, ValueError):
        raise ConfigError(f"module '{mid}' has non-integer 'order': {raw['order']!r}")
    return Module(
        id=mid,
        file=raw["file"],
        phase=raw["phase"],
        order=order,
        universal=bool(raw.get("universal", False)),
        applies_to=list(raw.get("applies_to", []) or []),
        account_scope=list(raw.get("account_scope", []) or []),
        depends_on=list(raw.get("depends_on", []) or []),
        adaptive=bool(raw.get("adaptive", False)),
    )


def load_config(config_dir: Path) -> Config:
    """Parse modules.yaml, roles.yaml, accounts.yaml into a Config."""
    config_dir = Path(config_dir)
    modules_raw = _load_yaml(config_dir / "modules.yaml").get("modules")
    if not isinstance(modules_raw, list):
        raise ConfigError("modules.yaml must contain a 'modules:' list")

    modules = [_parse_module(m, i) for i, m in enumerate(modules_raw)]

    seen: set[str] = set()
    for m in modules:
        if m.id in seen:
            raise ConfigError(f"duplicate module id in modules.yaml: '{m.id}'")
        seen.add(m.id)

    roles = _load_yaml(config_dir / "roles.yaml").get("roles") or {}
    accounts = _load_yaml(config_dir / "accounts.yaml").get("accounts") or {}
    return Config(modules=modules, roles=roles, accounts=accounts)


# --------------------------------------------------------------------------- #
# Resolution
# --------------------------------------------------------------------------- #
def select_modules(modules: list[Module], hire: Hire) -> list[Module]:
    """SPEC §4.1–4.2: collect candidates, then dedupe by id (order-preserving)."""
    selected: list[Module] = []
    seen: set[str] = set()
    for m in modules:
        match = (
            m.universal
            or hire.role in m.applies_to
            or hire.account in m.account_scope
        )
        if match and m.id not in seen:
            selected.append(m)
            seen.add(m.id)
    return selected


def topo_sort(selected: list[Module]) -> list[Module]:
    """Kahn topological sort by depends_on, restricted to the selected set.

    Dependencies not present in the selected set are ignored here (they are
    reported by the gap checker). Ties are broken deterministically by
    (phase index, order, id) so output is stable run-to-run.
    """
    selected_ids = {m.id for m in selected}
    by_id = {m.id: m for m in selected}

    # Edges: dependency -> module that depends on it.
    indegree: dict[str, int] = {m.id: 0 for m in selected}
    dependents: dict[str, list[str]] = {m.id: [] for m in selected}
    for m in selected:
        for dep in m.depends_on:
            if dep in selected_ids:
                indegree[m.id] += 1
                dependents[dep].append(m.id)

    def sort_key(mid: str) -> tuple[int, int, str]:
        mod = by_id[mid]
        phase_idx = PHASE_ORDER.index(mod.phase) if mod.phase in PHASE_ORDER else len(PHASE_ORDER)
        return (phase_idx, mod.order, mod.id)

    ready = sorted([mid for mid, d in indegree.items() if d == 0], key=sort_key)
    ordered: list[Module] = []
    while ready:
        current = ready.pop(0)
        ordered.append(by_id[current])
        for nxt in dependents[current]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                ready.append(nxt)
        ready.sort(key=sort_key)

    # If a dependency cycle exists, some nodes never reach indegree 0.
    # Append them deterministically so we never silently drop content;
    # the gap checker is responsible for surfacing the inconsistency.
    if len(ordered) < len(selected):
        remaining = [m for m in selected if m.id not in {o.id for o in ordered}]
        ordered.extend(sorted(remaining, key=lambda m: sort_key(m.id)))
    return ordered


def group_by_phase(ordered: list[Module]) -> list[Phase]:
    """Group into all four phases (empty allowed), sorted within phase by order."""
    phases: list[Phase] = []
    for key in PHASE_ORDER:
        members = [m for m in ordered if m.phase == key]
        members.sort(key=lambda m: (m.order, m.id))
        phases.append(Phase(key=key, label=PHASE_LABELS[key], modules=members))
    return phases


def resolve_manager_and_buddy(hire: Hire, config: Config) -> None:
    """Fill in hire.manager / hire.buddy from config (mutates hire).

    Precedence for manager: account.manager > role.default_manager > None.
    """
    account = config.accounts.get(hire.account, {})
    role = config.roles.get(hire.role, {})
    if hire.manager is None:
        hire.manager = account.get("manager") or role.get("default_manager")
    if hire.buddy is None:
        hire.buddy = account.get("buddy")


def resolve_plan(config: Config, hire: Hire) -> Plan:
    """Full resolution pipeline (SPEC §4)."""
    resolve_manager_and_buddy(hire, config)
    selected = select_modules(config.modules, hire)
    ordered = topo_sort(selected)
    phases = group_by_phase(ordered)
    return Plan(hire=hire, selected=selected, phases=phases)
