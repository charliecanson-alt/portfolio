"""Compile pipeline — the shared resolve -> substitute -> gap-check path.

Both the CLI (`build`, `start`) and the test suite call `compile_plan`, so the
exact logic that produces a hire's plan is exercised by tests. This module does
NO output I/O (no file writes, no PDF) — it only reads module content and
returns the assembled pieces. Rendering/writing lives in render.py + cli.py.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from . import gaps as gaps_mod
from .resolve import Config, Hire, Plan, resolve_plan
from .substitute import build_context, substitute_text


@dataclass
class CompileResult:
    plan: Plan
    contents: dict[str, str]  # module id -> substituted markdown body
    findings: list[gaps_mod.Finding] = field(default_factory=list)

    @property
    def has_errors(self) -> bool:
        return gaps_mod.has_errors(self.findings)


def compile_plan(config: Config, docs_dir: Path, hire: Hire) -> CompileResult:
    """Resolve the plan, substitute each module's content, and collect gaps."""
    docs_dir = Path(docs_dir)
    plan = resolve_plan(config, hire)

    context = build_context(hire, config)
    contents: dict[str, str] = {}
    missing_by_module: dict[str, list[str]] = {}
    unknown_by_module: dict[str, list[str]] = {}

    findings = gaps_mod.check_plan(config, plan)

    for module in plan.selected:
        path = docs_dir / module.file
        if not path.exists():
            findings.append(
                gaps_mod.Finding(
                    severity="error",
                    kind="missing-content-file",
                    message=(
                        f"Content file '{module.file}' for module '{module.id}' "
                        f"was not found under {docs_dir}."
                    ),
                    module=module.id,
                )
            )
            contents[module.id] = f"### {module.id}\n\n_[content file missing]_"
            continue
        raw = path.read_text(encoding="utf-8")
        result = substitute_text(raw, context)
        contents[module.id] = result.text
        if result.missing:
            missing_by_module[module.id] = result.missing
        if result.unknown:
            unknown_by_module[module.id] = result.unknown

    findings += gaps_mod.variable_findings(missing_by_module, unknown_by_module)
    return CompileResult(plan=plan, contents=contents, findings=findings)
