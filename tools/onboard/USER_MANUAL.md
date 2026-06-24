# Onboard — User Manual

A practical guide to running Onboard: every command, every input, every valid
value, and what comes out the other end.

> **What Onboard is:** a tool that builds a personalized, sequenced onboarding
> plan (markdown + branded PDF) for a new hire, plus a gap report that flags
> problems. It picks the right modules based on the hire's **role** and assigned
> **account**, orders them into phases, and fills in personal details.

---

## Contents
1. [Before you start](#1-before-you-start)
2. [The three commands at a glance](#2-the-three-commands-at-a-glance)
3. [Interactive mode (`onboard start`)](#3-interactive-mode-onboard-start)
4. [Build mode (`onboard build`)](#4-build-mode-onboard-build)
5. [Check mode (`onboard check`)](#5-check-mode-onboard-check)
6. [Valid input values](#6-valid-input-values)
7. [What gets produced](#7-what-gets-produced)
8. [The gap report & exit codes](#8-the-gap-report--exit-codes)
9. [Personalization tokens](#9-personalization-tokens)
10. [Adding roles, accounts, and modules](#10-adding-roles-accounts-and-modules)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Before you start

**Requirements:** Python 3.10+. For PDF output you also need the GTK runtime
(see [Troubleshooting](#11-troubleshooting)); without it the plan is still
produced as markdown.

**Install (one time):**
```bash
cd onboard
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -e .            # exposes the `onboard` command
pip install -e ".[dev]"     # add this if you want to run the tests
```

**Two ways to run every command** — pick whichever you prefer:
| Installed command | Equivalent without installing |
|---|---|
| `onboard start` | `python -m src.cli start` |
| `onboard build …` | `python -m src.cli build …` |
| `onboard check` | `python -m src.cli check` |

Run commands **from the repo root** (the folder containing `config/` and
`docs/`), unless you override the config/docs locations with options.

**Getting help on any command:**
```bash
onboard --help
onboard build --help
onboard start --help
onboard check --help
```

---

## 2. The three commands at a glance

| Command | Use it when | Needs flags? |
|---|---|---|
| `onboard start` | You want a guided, no-flags experience. **This is the default** — running just `onboard` starts it. | No — it asks you everything |
| `onboard build` | You're scripting/automating, or you already know the exact values. | Yes — 5 required flags |
| `onboard check` | You want to validate the config and content without building a plan (e.g. in CI). | No |

---

## 3. Interactive mode (`onboard start`)

The friendliest way in. Run either of these:
```bash
onboard
onboard start
```

You'll be walked through **five numbered steps** plus a confirmation. Every
answer is validated; a bad entry is explained and re-asked (it never crashes).

| Step | Prompt | What to type | Validation |
|---|---|---|---|
| 1 | Enter the new employee's full name | Free text, e.g. `Charlie Nguyen` | Cannot be empty |
| 2 | Select the role | The **number** next to a role | Must be a listed number |
| 3 | Select seniority | `1` Junior, `2` Associate, `3` Senior | Must be 1–3 |
| 4 | Select the account | The **number** next to an account | Must be a listed number |
| 5 | Enter start date | `YYYY-MM-DD`, e.g. `2026-07-01` | Must match that exact format |
| — | Confirmation | `1` to proceed, `2` to cancel | Must be 1 or 2 |

The **role and account menus are generated from your config files**, so they
always reflect what's actually available. Example session:

```
=== Onboard - new hire plan builder ===
Answer the prompts below. No flags or technical knowledge needed.

Step 1. Enter the new employee's full name: Charlie Nguyen
Step 2. Select the role:
  1) Ads Specialist
  2) Analyst
  3) Account Manager
  Enter a number: 2
Step 3. Select seniority:
  1) Junior
  2) Associate
  3) Senior
  Enter a number: 1
Step 4. Select the account:
  1) Acme Retail
  2) Globex Foods
  Enter a number: 1
Step 5. Enter start date (YYYY-MM-DD): 2026-07-01
Build plan for Charlie Nguyen, Analyst (Junior), Acme Retail, starting 2026-07-01?
  1) Proceed
  2) Cancel
  Enter a number: 1
```

Choosing **2 (Cancel)** at the confirmation exits without writing any files.

**Options for `onboard start`** (all optional — defaults are usually fine):

| Option | Default | Meaning |
|---|---|---|
| `--out <dir>` | `output` | Where to write the generated files |
| `--config-dir <dir>` | `config` | Folder holding `modules.yaml`, `roles.yaml`, `accounts.yaml` |
| `--docs-dir <dir>` | `docs/onboarding` | Folder holding the module markdown files |

---

## 4. Build mode (`onboard build`)

The non-interactive command — supply everything as flags. Ideal for scripts and CI.

```bash
onboard build \
  --name "Charlie Nguyen" \
  --role analyst \
  --account acme-retail \
  --seniority junior \
  --start-date 2026-07-01 \
  --out ./output/analyst
```

### Full option reference

| Option | Required | Default | Notes |
|---|---|---|---|
| `--name <text>` | **Yes** | — | The hire's full name. Wrap in quotes if it contains spaces. |
| `--role <slug>` | **Yes** | — | A role **slug** from `roles.yaml` (see [valid values](#6-valid-input-values)). |
| `--account <slug>` | **Yes** | — | An account **slug** from `accounts.yaml`. |
| `--seniority <text>` | **Yes** | — | `junior` / `associate` / `senior`. Captured but **not yet used** (reserved for the future phrasing layer). Any text is accepted. |
| `--start-date <YYYY-MM-DD>` | **Yes** | — | The start date. (Build mode does not hard-validate the format; use `YYYY-MM-DD` for correct output.) |
| `--out <dir>` | No | `output` | Output directory. |
| `--config-dir <dir>` | No | `config` | Config folder. |
| `--docs-dir <dir>` | No | `docs/onboarding` | Content folder. |

> **Note on flags:** `--role` and `--account` take the lowercase **slug**
> (e.g. `ads-specialist`), not the display label (`Ads Specialist`). Passing a
> value that isn't in the config doesn't crash — it produces `unmapped-role` /
> `unmapped-account` warnings, and may produce errors if a needed token (like
> `{{buddy}}`) can't be resolved.

---

## 5. Check mode (`onboard check`)

Validates configuration and content **without building a hire's plan**. Good for
catching mistakes after editing the config (e.g. a module pointing at a missing
file, or a dependency that doesn't exist).

```bash
onboard check                                    # prints results to the console
onboard check --out ./output/config_validation.md  # also writes a report file
```

### Options

| Option | Default | Meaning |
|---|---|---|
| `--out <file>` | *(none)* | If given, also writes the validation report to this file. |
| `--config-dir <dir>` | `config` | Config folder. |
| `--docs-dir <dir>` | `docs/onboarding` | Content folder. |

`check` exits with a **non-zero code if any error-level problems exist**, so it
works as a CI gate. What it validates:
- Every module's content `file` exists under the docs folder.
- Every `depends_on` target refers to a real module in `modules.yaml`.
- Roles in `applies_to` and accounts in `account_scope` are defined.
- Roles/accounts that end up with no modules at all (likely an omission).

---

## 6. Valid input values

These are the values shipped with the sample config. They come from the config
files, so **your actual list may differ if the config has been edited.** To see
the live list, run `onboard start` (the menus print everything) or open the
config files.

### Roles (`config/roles.yaml`)
| Slug (use with `--role`) | Display label |
|---|---|
| `ads-specialist` | Ads Specialist |
| `analyst` | Analyst |
| `account-manager` | Account Manager |

### Accounts (`config/accounts.yaml`)
| Slug (use with `--account`) | Display label |
|---|---|
| `acme-retail` | Acme Retail |
| `globex-foods` | Globex Foods |

### Seniority (fixed set)
| Interactive choice | Equivalent `--seniority` value |
|---|---|
| 1) Junior | `junior` |
| 2) Associate | `associate` |
| 3) Senior | `senior` |

### Start date
Format **`YYYY-MM-DD`** (four-digit year, two-digit month, two-digit day),
e.g. `2026-07-01`. Interactive mode re-prompts until the format is correct.

---

## 7. What gets produced

Every successful `build` (and the build at the end of `start`) writes three files
into the `--out` directory. **They are uniquely named per build, so a second run
never overwrites the first.** All three share one stem:

```
Week1-3_<LASTNAME>_<ROLE>_<SENIORITY>
```
- **LASTNAME** = last word of the name, uppercased (e.g. `NGUYEN`)
- **ROLE** = the role slug, uppercased (e.g. `ANALYST`, `ADS_SPECIALIST`)
- **SENIORITY** = uppercased (e.g. `JUNIOR`)
- Example stem: `Week1-3_NGUYEN_ANALYST_JUNIOR`

| File (using the example stem) | What it is |
|---|---|
| `Week1-3_NGUYEN_ANALYST_JUNIOR.md` | The full onboarding plan as markdown — title, hire details, every selected module grouped under phase headings (Day 1 → Week 1 → Week 2 → Week 3+), and a closing line. |
| `Week1-3_NGUYEN_ANALYST_JUNIOR.pdf` | The same plan as a branded PDF (lime accent, clean headings). **Only produced if PDF rendering is available** — otherwise it's skipped with a message and the markdown still works. |
| `Week1-3_NGUYEN_ANALYST_JUNIOR_gaps.md` | The consistency findings for this hire (see next section). Always written, even when the build is blocked. |

If you build the **same hire twice**, the second set's stem gets a
`_YYYYMMDD-HHMMSS` timestamp appended (e.g.
`Week1-3_NGUYEN_ANALYST_JUNIOR_20260623-142530.md`) so the earlier files stay put.

---

## 8. The gap report & exit codes

Onboard reports problems instead of hiding them. Each finding has a severity:

| Finding | Severity | Effect |
|---|---|---|
| Missing dependency (a needed module isn't in this hire's plan) | **error** | **Blocks the build** — no PDF |
| Missing / unknown personalization variable | **error** | **Blocks the build** |
| Sequencing gap (a dependency lands in a *later* phase) | warning | Build completes, flagged |
| Unmapped role / account (not in config) | warning | Build completes, flagged |
| Empty phase (a phase has no modules) | info | Informational only |

**Exit codes:**
| Command | Exit 0 | Exit 1 |
|---|---|---|
| `build` / `start` | No error-level gaps | One or more **error** gaps (PDF not generated) |
| `check` | Config is clean | One or more **error** problems found |

When a build is blocked, the plan markdown (`<stem>.md`) and the gap report
(`<stem>_gaps.md`) are still written so you can see exactly what went wrong.

---

## 9. Personalization tokens

Module content (the markdown files under `docs/onboarding/`) can include these
placeholders, which Onboard replaces with exact values per hire:

| Token | Filled from |
|---|---|
| `{{name}}` | The `--name` you provide |
| `{{first_name}}` | First word of the name |
| `{{role}}` | The role's display label (e.g. "Analyst") |
| `{{account}}` | The account's display label (e.g. "Acme Retail") |
| `{{manager}}` | The account's `manager`, or the role's `default_manager` |
| `{{start_date}}` | The `--start-date` you provide |
| `{{buddy}}` | The account's `buddy` (optional) |

If a token can't be filled, Onboard **never** prints a raw `{{token}}`. Instead it
writes a visible `[[MISSING: token]]` marker and records a missing-variable
**error** that blocks the build — so a half-filled guide never reaches a new hire.

---

## 10. Adding roles, accounts, and modules

Everything is config-driven; you don't touch code to extend the library.

**Add a role** — edit `config/roles.yaml`:
```yaml
roles:
  content-strategist:
    label: "Content Strategist"
    default_manager: "Taylor Quinn"
```
It appears in the interactive role menu automatically.

**Add an account** — edit `config/accounts.yaml`:
```yaml
accounts:
  initech:
    label: "Initech"
    manager: "Bill Lumbergh"
    buddy: "Milton Waddams"
```

**Add a module** — create the markdown file under `docs/onboarding/`, then
register it in `config/modules.yaml`:
```yaml
  - id: brand-voice-workshop
    file: brand-voice-workshop.md
    applies_to: [content-strategist]   # who needs it
    phase: week-1                       # day-1 | week-1 | week-2 | week-3-plus
    order: 30                           # sort position within the phase
    depends_on: [platform-access]       # optional; must be modules they also get
    adaptive: true                      # optional; reserved, currently ignored
```
Selection rules: a module is included when `universal: true`, **or** the hire's
role is in `applies_to`, **or** the hire's account is in `account_scope`.

After any config change, run `onboard check` to validate before building.

---

## 11. Troubleshooting

**"PDF skipped: WeasyPrint unavailable…"**
PDF rendering needs the native GTK/Pango libraries. The markdown and gap report
are still produced. To enable PDFs on Windows:
```powershell
winget install --id tschoonj.GTKForWindows -e
```
The installer adds `C:\Program Files\GTK3-Runtime Win64\bin` to your PATH. Open a
**new** terminal afterward, then re-run the build. On macOS/Linux the WeasyPrint
docs cover the native package install.

**"Build blocked by error-level gaps."**
Open the build's `*_gaps.md` report in your `--out` folder. Common causes: a missing
personalization value (e.g. you used an account that isn't in `accounts.yaml`, so
`{{buddy}}` can't resolve), or a module whose dependency isn't included for that
role. Fix the config/content and re-run.

**"Configuration error: …"**
A YAML file is missing, empty, or malformed, or a module is missing a required
field (`id`, `file`, `phase`, `order`) or uses an invalid `phase`. The message
names the file/module — fix it and retry.

**The command `onboard` isn't found.**
Either run `pip install -e .` first, or use the `python -m src.cli …` form. Make
sure your virtual environment is activated.

**I ran it from the wrong folder.**
Run from the repo root, or pass `--config-dir` and `--docs-dir` with the correct
paths.
```bash
onboard build --name "…" --role analyst --account acme-retail \
  --seniority junior --start-date 2026-07-01 \
  --config-dir /path/to/config --docs-dir /path/to/docs/onboarding
```
