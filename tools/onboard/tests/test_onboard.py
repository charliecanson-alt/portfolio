"""Small but meaningful test suite for Onboard's deterministic core.

Covers: resolver selection + role divergence, cross-role sharing, phase
grouping + within-phase ordering, dependency sequencing (the planted gap),
and that an error-level gap blocks the build.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from src.pipeline import compile_plan
from src.render import (
    PLAN_CLOSING_LINE,
    assemble_markdown,
    plan_stem,
    resolve_unique_stem,
)
from src.resolve import PHASE_ORDER, Hire, load_config

ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT / "config"
DOCS_DIR = ROOT / "docs" / "onboarding"


@pytest.fixture(scope="module")
def config():
    return load_config(CONFIG_DIR)


def _hire(role: str, account: str = "acme-retail") -> Hire:
    return Hire(
        name="Charlie Nguyen",
        role=role,
        account=account,
        seniority="junior",
        start_date="2026-07-01",
    )


def _selected_ids(config, role, account="acme-retail"):
    result = compile_plan(config, DOCS_DIR, _hire(role, account))
    return {m.id for m in result.plan.selected}


# --------------------------------------------------------------------------- #
# Selection + role divergence
# --------------------------------------------------------------------------- #
def test_roles_select_distinct_modules(config):
    ads = _selected_ids(config, "ads-specialist")
    analyst = _selected_ids(config, "analyst")

    # Each role gets its own signature modules...
    assert "campaign-naming-conventions" in ads
    assert "campaign-naming-conventions" not in analyst
    assert "sql-fundamentals" in analyst
    assert "sql-fundamentals" not in ads

    # ...and the two plans are genuinely different.
    assert ads != analyst


def test_universal_modules_present_for_every_role(config):
    for role in ("ads-specialist", "analyst", "account-manager"):
        ids = _selected_ids(config, role)
        assert {"welcome-and-mission", "how-we-work", "growth-and-goals"} <= ids


def test_account_scoped_module_injected(config):
    acme = _selected_ids(config, "analyst", "acme-retail")
    globex = _selected_ids(config, "analyst", "globex-foods")
    assert "acme-brand-guidelines" in acme
    assert "acme-brand-guidelines" not in globex
    assert "globex-brand-guidelines" in globex


def test_cross_role_modules_shared(config):
    # platform-access is shared by ads-specialist + analyst.
    assert "platform-access" in _selected_ids(config, "ads-specialist")
    assert "platform-access" in _selected_ids(config, "analyst")
    # reporting-and-insights is shared by analyst + account-manager.
    assert "reporting-and-insights" in _selected_ids(config, "analyst")
    assert "reporting-and-insights" in _selected_ids(config, "account-manager")


# --------------------------------------------------------------------------- #
# Phase grouping + ordering
# --------------------------------------------------------------------------- #
def test_phases_in_canonical_order(config):
    result = compile_plan(config, DOCS_DIR, _hire("ads-specialist"))
    assert [p.key for p in result.plan.phases] == PHASE_ORDER


def test_within_phase_sorted_by_order(config):
    result = compile_plan(config, DOCS_DIR, _hire("ads-specialist"))
    for phase in result.plan.phases:
        orders = [m.order for m in phase.modules]
        assert orders == sorted(orders), f"{phase.key} not sorted by order: {orders}"
    # Spot-check the ads week-2 sequence specifically.
    week2 = next(p for p in result.plan.phases if p.key == "week-2")
    assert [m.id for m in week2.modules] == [
        "budget-pacing-basics",
        "creative-trafficking",
        "qa-before-launch",
    ]


# --------------------------------------------------------------------------- #
# Dependency checks
# --------------------------------------------------------------------------- #
def test_planted_sequencing_gap_is_caught_as_warning(config):
    result = compile_plan(config, DOCS_DIR, _hire("analyst"))
    seq = [f for f in result.findings if f.kind == "sequencing-gap"]
    assert len(seq) == 1
    assert seq[0].severity == "warning"
    assert seq[0].module == "dashboard-standards"
    # The planted gap is a warning, so the analyst build is NOT blocked.
    assert not result.has_errors


def test_no_missing_dependency_errors_on_normal_builds(config):
    for role in ("ads-specialist", "analyst", "account-manager"):
        result = compile_plan(config, DOCS_DIR, _hire(role))
        missing = [f for f in result.findings if f.kind == "missing-dependency"]
        assert missing == [], f"{role} had missing-dependency: {missing}"


# --------------------------------------------------------------------------- #
# Error-level gap blocks the build
# --------------------------------------------------------------------------- #
def test_unmapped_account_blocks_build_via_missing_variable(config):
    # An account not in accounts.yaml has no buddy; modules referencing
    # {{buddy}} then produce missing-variable errors that block the build.
    result = compile_plan(config, DOCS_DIR, _hire("analyst", "no-such-account"))
    assert result.has_errors
    kinds = {f.kind for f in result.findings}
    assert "missing-variable" in kinds
    assert "unmapped-account" in kinds


# --------------------------------------------------------------------------- #
# Output naming + closing line
# --------------------------------------------------------------------------- #
def test_plan_stem_is_sanitized():
    hire = Hire(
        name="Charlie Nguyen",
        role="ads-specialist",
        account="acme-retail",
        seniority="junior",
        start_date="2026-07-01",
    )
    assert plan_stem(hire) == "Week1-3_NGUYEN_ADS_SPECIALIST_JUNIOR"


def test_resolve_unique_stem_avoids_collision(tmp_path):
    stem = "Week1-3_NGUYEN_ANALYST_JUNIOR"
    # First call: nothing exists yet, so the base stem is returned.
    assert resolve_unique_stem(tmp_path, stem) == stem
    # Simulate a prior build by creating one of the three artifacts.
    (tmp_path / f"{stem}.pdf").write_text("x", encoding="utf-8")
    unique = resolve_unique_stem(tmp_path, stem)
    assert unique != stem
    assert unique.startswith(stem + "_")


def test_closing_line_appended_to_plan(config):
    result = compile_plan(config, DOCS_DIR, _hire("analyst"))
    md = assemble_markdown(result.plan, result.contents)
    assert md.rstrip().endswith(PLAN_CLOSING_LINE)
