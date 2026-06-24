# Onboard

A config-driven onboarding **learning-plan compiler**. Give it a new hire's name,
role, account, seniority, and start date; it resolves which markdown modules they
need (universal + role-matched + account-matched), dependency-sorts them, groups
them into phases, injects exact personal variables, and outputs a branded
markdown + PDF plan plus a gap report.

> **Scope of this build:** Phases 1–4 of the spec — **resolver, substitution,
> PDF rendering, and the gap checker**, plus an interactive guided mode. There is
> **no AI/adaptation layer** yet (Phase 5). `adaptive:` fields in `modules.yaml`
> are parsed and deliberately ignored, and `--seniority` is captured but unused,
> so the AI layer can drop in later without a config migration.

---

## What it does (Phases 1–4)

1. **Resolve** (`src/resolve.py`) — select modules where `universal` OR the hire's
   `role` is in `applies_to` OR the hire's `account` is in `account_scope`; dedupe
   by `id`; topologically sort by `depends_on`; group into the fixed phase order
   `day-1 → week-1 → week-2 → week-3-plus`; sort within each phase by `order`.
2. **Substitute** (`src/substitute.py`) — replace `{{name}}`, `{{first_name}}`,
   `{{role}}`, `{{account}}`, `{{manager}}`, `{{start_date}}`, `{{buddy}}` with
   exact values. A token with no value is **never** emitted literally — it becomes
   a visible `[[MISSING: token]]` marker **and** an error in the gap report.
3. **Render** (`src/render.py`) — assemble the plan markdown grouped under phase
   headings (ending with a closing line), then render a branded PDF (lime accent
   `#B6FF3C`, clean sans-serif, clear phase headers) via WeasyPrint. Output files
   are uniquely named per build (see [Usage](#usage)).
4. **Gap check** (`src/gaps.py`) — emit a gap report (`<stem>_gaps.md`) with
   findings at `error` / `warning` / `info`. **`error` blocks the build.**

The shared resolve → substitute → gap-check path lives in `src/pipeline.py`, so
the CLI and the test suite exercise exactly the same logic.

| Finding | Severity |
|---|---|
| Missing dependency (dep not selected for this hire) | **error** |
| Missing / unknown variable | **error** |
| Sequencing gap (dependency in a later phase) | warning |
| Unmapped role / account | warning |
| Empty phase | info |

---

## Setup

Requires **Python 3.10+**.

```bash
cd onboard
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

# Editable install — exposes the `onboard` command:
pip install -e .
# (add dev tools for the test suite)
pip install -e ".[dev]"
```

After `pip install -e .` you can run `onboard …` directly. If you'd rather not
install, every command also works as `python -m src.cli …`.

---

## Usage

### Interactive guided mode (default)

For a non-technical user — no flags to remember. Just run:

```bash
onboard            # or: onboard start
```

It walks through numbered prompts: name → role → seniority → account → start date
→ a confirmation, then builds the plan. The **role and account menus are built
from the config files**, so adding a role to `roles.yaml` makes it appear
automatically. Every input is validated and re-prompts on bad entries.

```
=== Onboard - new hire plan builder ===
Step 1. Enter the new employee's full name: Charlie Nguyen
Step 2. Select the role:
  1) Ads Specialist
  2) Analyst
  3) Account Manager
  Enter a number: 2
Step 3. Select seniority:
  1) Junior  2) Associate  3) Senior
  Enter a number: 1
Step 4. Select the account:
  1) Acme Retail
  2) Globex Foods
  Enter a number: 1
Step 5. Enter start date (YYYY-MM-DD): 2026-07-01
Build plan for Charlie Nguyen, Analyst (Junior), Acme Retail, starting 2026-07-01?
  1) Proceed  2) Cancel
  Enter a number: 1
```

### Non-interactive build (automation / CI)

```bash
onboard build \
  --name "Charlie Nguyen" \
  --role analyst \
  --account acme-retail \
  --seniority junior \
  --start-date 2026-07-01 \
  --out ./output/analyst
```

Writes a uniquely-named set into `--out`, so repeated builds never overwrite each
other. The three files share one stem: `Week1-3_<LASTNAME>_<ROLE>_<SENIORITY>`
(e.g. for the command above, `Week1-3_NGUYEN_ANALYST_JUNIOR`):
- `Week1-3_NGUYEN_ANALYST_JUNIOR.md` — assembled markdown
- `Week1-3_NGUYEN_ANALYST_JUNIOR.pdf` — branded PDF (skipped with a clear message if WeasyPrint can't load)
- `Week1-3_NGUYEN_ANALYST_JUNIOR_gaps.md` — consistency findings

If the same hire is built twice, a `_YYYYMMDD-HHMMSS` timestamp is appended to the
stem so the earlier set is preserved.

### Validate config + content (no build)

```bash
onboard check                       # console only
onboard check --out ./output/config_validation.md   # also writes a report file
```

CI-friendly: exits non-zero if any `error`-level problems exist.

### Tests

```bash
pytest
```

Covers resolver selection + role divergence, cross-role sharing, phase grouping
and within-phase ordering, the planted sequencing gap, and that an error-level
gap blocks the build.

---

## Content library & sample data

A small universal base plus richer per-role sets, so different roles produce
visibly different plans.

- **Universal (everyone):** `welcome-and-mission`, `how-we-work`, `growth-and-goals`
- **Cross-role (shared via `applies_to`):** `platform-access` (ads-specialist +
  analyst), `reporting-and-insights` (analyst + account-manager)
- **Ads Specialist:** platform-access, campaign-naming-conventions,
  campaign-setup-checklist, budget-pacing-basics, creative-trafficking, qa-before-launch
- **Analyst:** platform-access, sql-fundamentals, dashboard-standards,
  analytics-deep-dive, reporting-and-insights
- **Account Manager:** client-comms-norms, stakeholder-mapping, scope-and-briefs,
  status-report-cadence, escalation-paths, reporting-and-insights
- **Account-scoped:** `acme-brand-guidelines` (acme-retail),
  `globex-brand-guidelines` (globex-foods)

**Same input → different correct plan.** Build for `analyst` vs `ads-specialist`
vs `account-manager` and compare — each gets its own signature modules, the
cross-role modules show the shared-topic case, and the account-scoped brand module
swaps based on the assigned account.

### The deliberately planted gap

`dashboard-standards` (analyst, **Week 1**) `depends_on` `analytics-deep-dive`,
which lives in **Week 2** — a *later* phase. That's a **sequencing gap**: a
`warning`, so the build completes and you can see it in the build's `*_gaps.md`
report. Both modules are analyst-only, so the account-manager and ads-specialist
builds stay clean.

```bash
onboard build --name "Charlie Nguyen" --role analyst \
  --account acme-retail --seniority junior --start-date 2026-07-01 --out ./output/analyst
# -> Gap check: 0 error(s), 1 warning(s), 0 info
# -> Week1-3_NGUYEN_ANALYST_JUNIOR_gaps.md: [sequencing-gap] Module 'dashboard-standards'
#    (Week 1) depends on 'analytics-deep-dive', which is scheduled later in Week 2.
```

### Seeing an error-level gap block a build

Build for an account that isn't in `accounts.yaml` (so `{{buddy}}` can't resolve),
to watch an `error` block the build — non-zero exit, no PDF, report still written:

```bash
onboard build --name "Sam Okafor" --role analyst --account no-such-account \
  --seniority junior --start-date 2026-08-01 --out ./output/tmp
```

---

## PDF rendering on Windows

WeasyPrint depends on native GTK/Pango libraries. If they aren't installed, the
PDF step is **skipped gracefully** — the plan markdown and the gap report are
still written, and the CLI prints why the PDF was skipped.

To enable PDF output, install the GTK3 runtime (this exact path is verified):

```powershell
winget install --id tschoonj.GTKForWindows -e
```

The installer adds `C:\Program Files\GTK3-Runtime Win64\bin` to PATH. Open a
**new** terminal afterward (or prepend that bin dir to PATH in the current one)
so WeasyPrint can find the libraries, then re-run `build`.

Alternatives: run on WSL/macOS/Linux where the native deps install cleanly, or
use the markdown output and convert with another tool (e.g. pandoc).

---

## Repo layout

```
onboard/
├── docs/onboarding/        # approved canonical content (markdown)
│   ├── welcome-and-mission.md
│   ├── how-we-work.md
│   ├── platform-access.md
│   ├── campaign-*.md, budget-*, creative-*, qa-*      # ads-specialist
│   ├── sql-fundamentals.md, dashboard-standards.md, analytics-deep-dive.md
│   ├── reporting-and-insights.md                      # cross-role
│   ├── client-comms-norms.md, stakeholder-*, scope-*, status-*, escalation-*
│   ├── growth-and-goals.md
│   └── accounts/
│       ├── acme-brand-guidelines.md
│       └── globex-brand-guidelines.md
├── config/
│   ├── modules.yaml
│   ├── roles.yaml
│   └── accounts.yaml
├── src/
│   ├── resolve.py          # selection + sort + phase grouping
│   ├── substitute.py       # variable injection
│   ├── pipeline.py         # shared compile path (used by CLI + tests)
│   ├── gaps.py             # consistency checks
│   ├── render.py           # markdown -> PDF
│   └── cli.py              # start / build / check
├── tests/
│   └── test_onboard.py
├── output/
├── pyproject.toml          # `onboard` entry point + deps
├── requirements.txt
└── SPEC.md
```

`adapt.py` and `variants/` are intentionally absent — they belong to Phase 5.
