"""Gap & consistency checking (SPEC §7) — the "Drift-style" value-add.

Onboard reports problems instead of hiding them. Findings carry a severity:

    error    blocks the build
    warning  build proceeds, but the issue is flagged
    info     informational only

The restraint principle from Drift applies: only flag what matters, ranked
by severity.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from .resolve import PHASE_LABELS, PHASE_ORDER, Config, Plan

SEVERITY_ORDER = ["error", "warning", "info"]
SEVERITY_LABELS = {
    "error": "Errors (block the build)",
    "warning": "Warnings (build proceeds)",
    "info": "Info",
}


@dataclass
class Finding:
    severity: str  # error | warning | info
    kind: str
    message: str
    module: str | None = None


# --------------------------------------------------------------------------- #
# Plan-level checks (run during `build`)
# --------------------------------------------------------------------------- #
def _phase_index(phase: str) -> int:
    return PHASE_ORDER.index(phase) if phase in PHASE_ORDER else len(PHASE_ORDER)


def check_dependencies(config: Config, plan: Plan) -> list[Finding]:
    """Missing dependency (error) + sequencing gap (warning)."""
    findings: list[Finding] = []
    selected_ids = {m.id for m in plan.selected}
    library_ids = set(config.modules_by_id)
    by_id = {m.id: m for m in plan.selected}

    for m in plan.selected:
        for dep in m.depends_on:
            if dep not in selected_ids:
                if dep in library_ids:
                    detail = (
                        f"it exists in the library but was not selected for this "
                        f"role/account"
                    )
                else:
                    detail = "no module with that id exists in the library"
                findings.append(
                    Finding(
                        severity="error",
                        kind="missing-dependency",
                        message=(
                            f"Module '{m.id}' depends on '{dep}', but {detail}."
                        ),
                        module=m.id,
                    )
                )
                continue
            # Dependency is present — check it isn't scheduled later (SPEC §4.4).
            dep_mod = by_id[dep]
            if _phase_index(dep_mod.phase) > _phase_index(m.phase):
                findings.append(
                    Finding(
                        severity="warning",
                        kind="sequencing-gap",
                        message=(
                            f"Module '{m.id}' ({PHASE_LABELS.get(m.phase, m.phase)}) "
                            f"depends on '{dep}', which is scheduled later in "
                            f"{PHASE_LABELS.get(dep_mod.phase, dep_mod.phase)}. "
                            f"The dependency should come in the same phase or earlier."
                        ),
                        module=m.id,
                    )
                )
    return findings


def check_unmapped(config: Config, plan: Plan) -> list[Finding]:
    """Unmapped role/account (warning) — likely a config omission."""
    findings: list[Finding] = []
    hire = plan.hire
    if hire.role not in config.roles:
        findings.append(
            Finding(
                severity="warning",
                kind="unmapped-role",
                message=(
                    f"Role '{hire.role}' is not defined in roles.yaml. "
                    f"Manager/label fall back to defaults and role-specific "
                    f"modules may be missing."
                ),
            )
        )
    if hire.account not in config.accounts:
        findings.append(
            Finding(
                severity="warning",
                kind="unmapped-account",
                message=(
                    f"Account '{hire.account}' is not defined in accounts.yaml. "
                    f"Account-specific modules and the buddy will be missing."
                ),
            )
        )
    return findings


def check_empty_phases(plan: Plan) -> list[Finding]:
    """Empty phase (info) — may be intentional."""
    findings: list[Finding] = []
    for phase in plan.phases:
        if not phase.modules:
            findings.append(
                Finding(
                    severity="info",
                    kind="empty-phase",
                    message=f"Phase '{phase.label}' has no modules for this hire.",
                )
            )
    return findings


def variable_findings(
    missing_by_module: dict[str, list[str]],
    unknown_by_module: dict[str, list[str]],
) -> list[Finding]:
    """Missing variable (error) — a token had no value (SPEC §5)."""
    findings: list[Finding] = []
    for module_id, tokens in missing_by_module.items():
        for token in tokens:
            findings.append(
                Finding(
                    severity="error",
                    kind="missing-variable",
                    message=(
                        f"Module '{module_id}' references {{{{{token}}}}} but no "
                        f"value was resolved for this hire."
                    ),
                    module=module_id,
                )
            )
    for module_id, tokens in unknown_by_module.items():
        for token in tokens:
            findings.append(
                Finding(
                    severity="error",
                    kind="unknown-variable",
                    message=(
                        f"Module '{module_id}' references {{{{{token}}}}}, which is "
                        f"not a known Onboard token."
                    ),
                    module=module_id,
                )
            )
    return findings


def check_plan(config: Config, plan: Plan) -> list[Finding]:
    """All plan-level checks except variable checks (which need substitution)."""
    findings: list[Finding] = []
    findings += check_dependencies(config, plan)
    findings += check_unmapped(config, plan)
    findings += check_empty_phases(plan)
    return findings


# --------------------------------------------------------------------------- #
# Config-level validation (run during `check`, hire-independent)
# --------------------------------------------------------------------------- #
def validate_config(config: Config, docs_dir: Path) -> list[Finding]:
    """Static validation of config + content without a specific hire."""
    findings: list[Finding] = []
    docs_dir = Path(docs_dir)
    library_ids = set(config.modules_by_id)

    for m in config.modules:
        # Content file must exist.
        if not (docs_dir / m.file).exists():
            findings.append(
                Finding(
                    severity="error",
                    kind="missing-content-file",
                    message=f"Module '{m.id}' points to '{m.file}', which does not exist under {docs_dir}.",
                    module=m.id,
                )
            )
        # depends_on targets must exist in the library.
        for dep in m.depends_on:
            if dep not in library_ids:
                findings.append(
                    Finding(
                        severity="error",
                        kind="dangling-dependency",
                        message=f"Module '{m.id}' depends_on '{dep}', which is not defined in modules.yaml.",
                        module=m.id,
                    )
                )
        # applies_to roles should exist in roles.yaml.
        for role in m.applies_to:
            if role not in config.roles:
                findings.append(
                    Finding(
                        severity="warning",
                        kind="unknown-role-reference",
                        message=f"Module '{m.id}' lists role '{role}' in applies_to, but it is not defined in roles.yaml.",
                        module=m.id,
                    )
                )
        # account_scope accounts should exist in accounts.yaml.
        for acct in m.account_scope:
            if acct not in config.accounts:
                findings.append(
                    Finding(
                        severity="warning",
                        kind="unknown-account-reference",
                        message=f"Module '{m.id}' lists account '{acct}' in account_scope, but it is not defined in accounts.yaml.",
                        module=m.id,
                    )
                )

    # A role/account with no modules at all is likely an omission.
    for role in config.roles:
        if not any(role in m.applies_to or m.universal for m in config.modules):
            findings.append(
                Finding(
                    severity="warning",
                    kind="role-without-modules",
                    message=f"Role '{role}' has no modules (not universal, not in any applies_to).",
                )
            )
    return findings


# --------------------------------------------------------------------------- #
# Reporting
# --------------------------------------------------------------------------- #
def has_errors(findings: list[Finding]) -> bool:
    return any(f.severity == "error" for f in findings)


def summarize(findings: list[Finding]) -> str:
    counts = {s: sum(1 for f in findings if f.severity == s) for s in SEVERITY_ORDER}
    return (
        f"{counts['error']} error(s), "
        f"{counts['warning']} warning(s), "
        f"{counts['info']} info"
    )


def render_gap_report(findings: list[Finding], title: str = "Gap Report") -> str:
    lines = [f"# {title}", ""]
    if not findings:
        lines.append("No issues found.")
        lines.append("")
        return "\n".join(lines)

    lines.append(f"**Summary:** {summarize(findings)}")
    lines.append("")

    for severity in SEVERITY_ORDER:
        bucket = [f for f in findings if f.severity == severity]
        if not bucket:
            continue
        lines.append(f"## {SEVERITY_LABELS[severity]}")
        lines.append("")
        for f in bucket:
            scope = f" _(module: `{f.module}`)_" if f.module else ""
            lines.append(f"- **[{f.kind}]** {f.message}{scope}")
        lines.append("")
    return "\n".join(lines)
