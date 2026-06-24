"""Onboard CLI (SPEC §9).

Commands:
    onboard start            interactive guided mode (DEFAULT when no args)
    onboard build  --name …  non-interactive, flag-driven (automation/CI)
    onboard check  [--out]   validate config + content without building

Phases 1–4 only: deterministic resolve -> substitute -> render + gap report.
The AI commands (`generate-variants`) are intentionally absent until Phase 5.

Run from the repo root (or after `pip install -e .`, just `onboard`):
    onboard start
    onboard build --name "Charlie" --role analyst --account acme-retail \\
        --seniority junior --start-date 2026-07-01
    onboard check
"""

from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

import click

from . import gaps as gaps_mod
from .pipeline import compile_plan
from .render import (
    assemble_markdown,
    plan_stem,
    render_pdf,
    resolve_unique_stem,
    stem_paths,
    write_markdown,
)
from .resolve import Config, ConfigError, Hire, load_config

DEFAULT_CONFIG_DIR = Path("config")
DEFAULT_DOCS_DIR = Path("docs/onboarding")
DEFAULT_OUT_DIR = Path("output")

# Seniority is a fixed, closed set (it does not affect output until Phase 5).
SENIORITY_CHOICES = [("junior", "Junior"), ("associate", "Associate"), ("senior", "Senior")]


# --------------------------------------------------------------------------- #
# Shared build execution (used by both `build` and `start`)
# --------------------------------------------------------------------------- #
def _execute_build(config: Config, hire: Hire, out: Path, docs: Path) -> bool:
    """Compile + write all outputs. Returns True if the build succeeded
    (no error-level gaps), False if it was blocked."""
    result = compile_plan(config, docs, hire)

    out.mkdir(parents=True, exist_ok=True)
    # Unique, meaningfully-named output set so builds never clobber each other.
    stem = resolve_unique_stem(out, plan_stem(hire))
    paths = stem_paths(out, stem)

    report = gaps_mod.render_gap_report(
        result.findings,
        title=f"Gap Report — {hire.name} ({hire.role} / {hire.account})",
    )
    write_markdown(report, paths["gaps"])

    plan_md = assemble_markdown(result.plan, result.contents)
    write_markdown(plan_md, paths["md"])

    click.echo(f"Selected {len(result.plan.selected)} module(s).")
    click.echo(f"Gap check: {gaps_mod.summarize(result.findings)}")
    click.echo(f"Wrote {paths['md']}")
    click.echo(f"Wrote {paths['gaps']}")

    # `error` blocks the build (SPEC §7): no PDF.
    if result.has_errors:
        click.echo(
            click.style(
                f"Build blocked by error-level gaps. See {paths['gaps'].name}. "
                "PDF not generated.",
                fg="red",
            )
        )
        return False

    ok, message = render_pdf(
        plan_md, paths["pdf"], title=f"Onboarding Plan — {hire.name}"
    )
    if ok:
        click.echo(click.style(message, fg="green"))
    else:
        click.echo(click.style(f"PDF skipped: {message}", fg="yellow"))
    return True


# --------------------------------------------------------------------------- #
# Interactive prompt helpers
# --------------------------------------------------------------------------- #
def _prompt_nonempty(label: str) -> str:
    while True:
        value = click.prompt(label, default="", show_default=False).lstrip("﻿").strip()
        if value:
            return value
        click.echo(click.style("  Please enter a value — this can't be empty.", fg="yellow"))


def _prompt_choice(label: str, options: list[tuple[str, str]]) -> str:
    """Print a numbered menu of (value, display) and return the chosen value."""
    click.echo(label)
    for i, (_, display) in enumerate(options, start=1):
        click.echo(f"  {i}) {display}")
    while True:
        raw = click.prompt("  Enter a number", default="", show_default=False).strip()
        if raw.isdigit():
            idx = int(raw)
            if 1 <= idx <= len(options):
                return options[idx - 1][0]
        click.echo(
            click.style(
                f"  Please enter a number between 1 and {len(options)}.", fg="yellow"
            )
        )


def _prompt_date(label: str) -> str:
    while True:
        value = click.prompt(label, default="", show_default=False).strip()
        try:
            datetime.strptime(value, "%Y-%m-%d")
            return value
        except ValueError:
            click.echo(
                click.style(
                    "  Please use the format YYYY-MM-DD, e.g. 2026-07-01.", fg="yellow"
                )
            )


# --------------------------------------------------------------------------- #
# CLI group — runs `start` when invoked with no subcommand
# --------------------------------------------------------------------------- #
def _configure_stdio() -> None:
    """Best-effort: decode piped UTF-8 input cleanly (stripping a leading BOM
    that some shells prepend) and emit UTF-8 output. No-op where unsupported."""
    for stream, enc in (
        (sys.stdin, "utf-8-sig"),
        (sys.stdout, "utf-8"),
        (sys.stderr, "utf-8"),
    ):
        try:
            stream.reconfigure(encoding=enc)  # type: ignore[attr-defined]
        except (AttributeError, ValueError, OSError):
            pass


@click.group(invoke_without_command=True)
@click.pass_context
def cli(ctx: click.Context) -> None:
    """Onboard - role & account-aware onboarding plan compiler."""
    _configure_stdio()
    if ctx.invoked_subcommand is None:
        ctx.invoke(start)


@cli.command()
@click.option("--out", "out_dir", default=str(DEFAULT_OUT_DIR), show_default=True,
              help="Output directory.")
@click.option("--config-dir", default=str(DEFAULT_CONFIG_DIR), show_default=True)
@click.option("--docs-dir", default=str(DEFAULT_DOCS_DIR), show_default=True)
def start(out_dir: str, config_dir: str, docs_dir: str) -> None:
    """Interactive guided mode - build a plan by answering numbered prompts."""
    try:
        config = load_config(Path(config_dir))
    except ConfigError as exc:
        raise click.ClickException(f"Configuration error: {exc}")

    if not config.roles:
        raise click.ClickException("No roles defined in roles.yaml.")
    if not config.accounts:
        raise click.ClickException("No accounts defined in accounts.yaml.")

    click.echo(click.style("\n=== Onboard - new hire plan builder ===", fg="cyan", bold=True))
    click.echo("Answer the prompts below. No flags or technical knowledge needed.\n")

    # Step 1 — name
    name = _prompt_nonempty("Step 1. Enter the new employee's full name:")

    # Step 2 — role (from config)
    role_options = [(slug, cfg.get("label", slug)) for slug, cfg in config.roles.items()]
    role = _prompt_choice("\nStep 2. Select the role:", role_options)

    # Step 3 — seniority (fixed set)
    seniority = _prompt_choice("\nStep 3. Select seniority:", SENIORITY_CHOICES)

    # Step 4 — account (from config)
    account_options = [(slug, cfg.get("label", slug)) for slug, cfg in config.accounts.items()]
    account = _prompt_choice("\nStep 4. Select the account:", account_options)

    # Step 5 — start date
    start_date = _prompt_date("\nStep 5. Enter start date (YYYY-MM-DD):")

    # Confirmation
    role_label = dict(role_options)[role]
    account_label = dict(account_options)[account]
    seniority_label = dict(SENIORITY_CHOICES)[seniority]
    click.echo("")
    proceed = _prompt_choice(
        f"Build plan for {name}, {role_label} ({seniority_label}), "
        f"{account_label}, starting {start_date}?",
        [("yes", "Proceed"), ("no", "Cancel")],
    )
    if proceed == "no":
        click.echo("Cancelled. No files were written.")
        return

    hire = Hire(name=name, role=role, account=account, seniority=seniority, start_date=start_date)
    click.echo("")
    _execute_build(config, hire, Path(out_dir), Path(docs_dir))


@cli.command()
@click.option("--name", required=True, help="New hire's full name.")
@click.option("--role", required=True, help="Role slug (e.g. ads-specialist, analyst).")
@click.option("--account", required=True, help="Account slug (e.g. acme-retail).")
@click.option("--seniority", required=True, help="Seniority (junior/associate/senior). Stored for Phase 5; unused now.")
@click.option("--start-date", required=True, help="Start date, e.g. 2026-07-01.")
@click.option("--out", "out_dir", default=str(DEFAULT_OUT_DIR), show_default=True,
              help="Output directory.")
@click.option("--config-dir", default=str(DEFAULT_CONFIG_DIR), show_default=True)
@click.option("--docs-dir", default=str(DEFAULT_DOCS_DIR), show_default=True)
def build(
    name: str,
    role: str,
    account: str,
    seniority: str,
    start_date: str,
    out_dir: str,
    config_dir: str,
    docs_dir: str,
) -> None:
    """Build a personalized, sequenced onboarding plan for one hire (flag-driven)."""
    try:
        config = load_config(Path(config_dir))
    except ConfigError as exc:
        raise click.ClickException(f"Configuration error: {exc}")

    hire = Hire(name=name, role=role, account=account, seniority=seniority, start_date=start_date)
    ok = _execute_build(config, hire, Path(out_dir), Path(docs_dir))
    if not ok:
        sys.exit(1)


@cli.command()
@click.option("--out", "out_file", default=None,
              help="Optional path to write the validation report (markdown).")
@click.option("--config-dir", default=str(DEFAULT_CONFIG_DIR), show_default=True)
@click.option("--docs-dir", default=str(DEFAULT_DOCS_DIR), show_default=True)
def check(out_file: str | None, config_dir: str, docs_dir: str) -> None:
    """Validate config + content without building (CI-friendly)."""
    try:
        config = load_config(Path(config_dir))
    except ConfigError as exc:
        raise click.ClickException(f"Configuration error: {exc}")

    findings = gaps_mod.validate_config(config, Path(docs_dir))
    report = gaps_mod.render_gap_report(findings, title="Config Validation")
    click.echo(report)

    if out_file:
        write_markdown(report, Path(out_file))
        click.echo(f"Wrote {out_file}")

    if gaps_mod.has_errors(findings):
        sys.exit(1)


if __name__ == "__main__":
    cli()
