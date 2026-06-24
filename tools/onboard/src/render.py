"""Render — assemble the plan into markdown, then a branded PDF (SPEC §3, §11).

Markdown assembly is pure and always works. PDF rendering uses WeasyPrint;
if WeasyPrint (or its native deps) isn't available, we degrade gracefully:
the markdown is still written and the caller is told why the PDF was skipped.
"""

from __future__ import annotations

import re
import secrets
from datetime import datetime
from pathlib import Path

import markdown as md_lib

from .resolve import Hire, Plan

# Lime accent matches the portfolio brand (SPEC §11).
ACCENT = "#B6FF3C"

# Closing sentence appended to the very end of every generated plan.
# Single source of truth — edit here to change the wording everywhere.
PLAN_CLOSING_LINE = (
    "The rest of your onboarding guide and resources will be provided to you soon."
)

_PDF_CSS = f"""
@page {{
    size: A4;
    margin: 22mm 18mm;
    @bottom-center {{
        content: counter(page) " / " counter(pages);
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        font-size: 9px;
        color: #888;
    }}
}}
body {{
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    color: #1a1a1a;
    font-size: 11.5pt;
    line-height: 1.55;
}}
h1 {{
    font-size: 26pt;
    font-weight: 800;
    letter-spacing: -0.01em;
    margin: 0 0 4px 0;
}}
.plan-meta {{
    color: #555;
    font-size: 10.5pt;
    border-left: 4px solid {ACCENT};
    padding-left: 12px;
    margin: 10px 0 28px 0;
}}
.plan-meta strong {{ color: #1a1a1a; }}
h2 {{
    font-size: 15pt;
    font-weight: 700;
    margin: 30px 0 6px 0;
    padding: 6px 0 6px 12px;
    border-left: 6px solid {ACCENT};
    background: #f5f5f0;
    page-break-after: avoid;
}}
h3 {{
    font-size: 12.5pt;
    font-weight: 700;
    margin: 20px 0 6px 0;
    page-break-after: avoid;
}}
a {{ color: #2b6cb0; }}
code {{
    background: #f0f0eb;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 10pt;
}}
hr {{
    border: none;
    border-top: 1px solid #e5e5e0;
    margin: 22px 0;
}}
ul, ol {{ margin: 6px 0 6px 0; padding-left: 22px; }}
li {{ margin: 3px 0; }}
"""


def assemble_markdown(plan: Plan, contents: dict[str, str]) -> str:
    """Build Day_1_Guide.md: title header + per-phase, ordered module content.

    `contents` maps module id -> already-substituted markdown body.
    Empty phases are skipped in the output (the gap report notes them).
    """
    hire = plan.hire
    meta_bits = [
        f"**Role:** {hire.role}",
        f"**Account:** {hire.account}",
        f"**Start date:** {hire.start_date}",
        f"**Manager:** {hire.manager or '—'}",
    ]
    lines = [
        f"# Onboarding Plan — {hire.name}",
        "",
        "  ·  ".join(meta_bits),
        "",
    ]
    for phase in plan.phases:
        if not phase.modules:
            continue
        lines.append(f"## {phase.label}")
        lines.append("")
        for i, module in enumerate(phase.modules):
            body = contents.get(module.id, "").strip()
            lines.append(body)
            lines.append("")
            if i < len(phase.modules) - 1:
                lines.append("---")
                lines.append("")
    # Closing line (single source of truth: PLAN_CLOSING_LINE).
    lines.append("---")
    lines.append("")
    lines.append(PLAN_CLOSING_LINE)
    return "\n".join(lines).rstrip() + "\n"


# --------------------------------------------------------------------------- #
# Output file naming
# --------------------------------------------------------------------------- #
def _sanitize(part: str) -> str:
    """Uppercase and make filesystem-safe: non-alphanumerics -> single '_'."""
    cleaned = re.sub(r"[^A-Z0-9]+", "_", (part or "").strip().upper()).strip("_")
    return cleaned or "NA"


def plan_stem(hire: Hire) -> str:
    """Shared filename stem for a build's artifacts.

    Format: Week1-3_<LASTNAME>_<ROLE>_<SENIORITY>
    e.g. "Charlie Nguyen" / ads-specialist / junior
         -> Week1-3_NGUYEN_ADS_SPECIALIST_JUNIOR
    """
    name = (hire.name or "").strip()
    last_name = name.split()[-1] if name else ""
    return f"Week1-3_{_sanitize(last_name)}_{_sanitize(hire.role)}_{_sanitize(hire.seniority)}"


def stem_paths(out_dir: Path, stem: str) -> dict[str, Path]:
    """The three artifact paths for a given stem."""
    out_dir = Path(out_dir)
    return {
        "md": out_dir / f"{stem}.md",
        "pdf": out_dir / f"{stem}.pdf",
        "gaps": out_dir / f"{stem}_gaps.md",
    }


def resolve_unique_stem(out_dir: Path, stem: str) -> str:
    """Return a stem whose .md/.pdf/_gaps.md don't yet exist in out_dir.

    Tries the base stem first; on collision appends a timestamp; if that is
    somehow also taken (two runs in the same second), appends random hex.
    """
    def taken(candidate: str) -> bool:
        return any(p.exists() for p in stem_paths(out_dir, candidate).values())

    if not taken(stem):
        return stem
    timestamped = f"{stem}_{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    if not taken(timestamped):
        return timestamped
    while True:
        candidate = f"{timestamped}_{secrets.token_hex(2)}"
        if not taken(candidate):
            return candidate


def write_markdown(text: str, out_path: Path) -> Path:
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(text, encoding="utf-8")
    return out_path


def _markdown_to_html(md_text: str, title: str) -> str:
    body_html = md_lib.markdown(
        md_text,
        extensions=["extra", "sane_lists"],
    )
    # Promote the meta paragraph (first <p> after <h1>) to a styled block so
    # the role/account/date line picks up the .plan-meta CSS rule.
    body_html = body_html.replace(
        "</h1>\n<p>", '</h1>\n<p class="plan-meta">', 1
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>{_PDF_CSS}</style>
</head>
<body>
{body_html}
</body>
</html>"""


def render_pdf(md_text: str, out_path: Path, title: str = "Onboarding Plan") -> tuple[bool, str]:
    """Render the assembled markdown to a branded PDF.

    Returns (ok, message). On any WeasyPrint import/runtime failure we return
    (False, reason) instead of raising, so the build can still ship the .md.
    """
    out_path = Path(out_path)
    try:
        from weasyprint import HTML  # imported lazily; native deps may be missing
    except Exception as exc:  # ImportError or OSError from missing GTK/Pango
        return (
            False,
            f"WeasyPrint unavailable ({exc.__class__.__name__}: {exc}). "
            f"Markdown was written; install WeasyPrint to enable PDF output.",
        )

    try:
        html = _markdown_to_html(md_text, title)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        HTML(string=html).write_pdf(str(out_path))
    except Exception as exc:
        return (False, f"PDF rendering failed ({exc.__class__.__name__}: {exc}).")
    return (True, f"PDF written to {out_path}")
