# Onboard — Role & Account-Aware Onboarding Plan Compiler

**Version:** 0.1 (spec)
**Author:** Charlie
**Tags:** `Claude · OpenAI API · Markdown · Python · PDF`

---

## 1. Summary

Onboard is a config-driven tool that compiles a **sequenced, personalized onboarding learning plan** for a new hire from a library of approved markdown modules. Instead of a manager hand-assembling getting-started links and docs into a one-off file, Onboard resolves which modules a person needs (based on **role** and **assigned account**), orders them into a logical **phased curriculum** (Day 1 → Week 1 → Week 2 → Week 3+), injects exact personal details, applies pre-approved trainee-aware phrasing, and outputs a branded PDF plus a markdown source.

The deterministic layer owns **correctness** (who gets what, in what order, with which names). The AI layer owns only **delivery** (tone/framing of approved content), and its output is reviewed and cached before it ever reaches a new hire.

---

## 2. Goals & non-goals

### Goals
- Turn a flat folder of onboarding docs into a **resolved, sequenced plan** tailored per hire.
- Support modules that apply to **multiple roles** but belong at a **specific phase** of onboarding.
- Inject exact personal/contextual variables with zero hallucination risk.
- Adapt phrasing by seniority/audience using **pre-approved, cached** AI variants.
- Surface **gaps and inconsistencies** (missing modules, broken dependencies) rather than silently producing an incomplete guide.
- Produce a clean, branded **PDF** plus the intermediate **markdown**.

### Non-goals
- Not a docs authoring/hosting platform (no Confluence/CMS dependency — content lives as markdown files).
- Not a live web app in v1 (it's a CLI/automation tool; a thin web form is a possible later add).
- The AI never **generates new onboarding facts** — it only rephrases approved content.
- No integration with HR systems / SSO / access provisioning in v1.

---

## 3. Core concepts

### 3.1 Module
A single onboarding topic = one markdown file + metadata. Metadata declares **who** needs it, **when** it belongs, and **dependencies**.

### 3.2 Role
A job function (e.g., `ads-specialist`, `analyst`, `account-manager`). Determines the base module set.

### 3.3 Account
The client/brand the hire is assigned to. Injects account-specific modules and context (brand guidelines, key contacts, tooling).

### 3.4 Plan
The resolved output: the **union** of universal + role + account modules, deduped, dependency-sorted, grouped by phase, with variables substituted and approved adapted phrasing applied.

### 3.5 Phase
A time bucket in the onboarding arc. Default phases: `day-1`, `week-1`, `week-2`, `week-3-plus`.

---

## 4. Resolution logic

Given `name`, `role`, `account`, `seniority`, `start_date`, `manager`:

1. **Collect candidate modules**
   - All modules where `universal: true`
   - All modules where `role` ∈ `applies_to`
   - All modules where `account` ∈ `account_scope` (account-specific modules)
2. **Dedupe** by module `id` (a module shared across role + universal appears once).
3. **Validate dependencies** — every `depends_on` id must resolve to an included module. If a dependency is missing → record a **gap** (see §7).
4. **Topological sort** within the candidate set by `depends_on`, then **group by `phase`**, then order within phase by `order` (ascending).
   - Dependency rule: a module's dependency must appear in the same phase or an earlier one. If a `depends_on` target lands in a later phase → record a **sequencing gap**.
5. **Select phrasing variant** per module based on `audience_note` + `seniority` (see §6).
6. **Substitute variables** (§5).
7. **Assemble** markdown grouped by phase → render PDF.

Pseudocode:

```python
def resolve_plan(hire, modules):
    selected = [m for m in modules
                if m.universal
                or hire.role in m.applies_to
                or hire.account in m.account_scope]
    selected = dedupe_by_id(selected)
    gaps = validate_dependencies(selected)
    ordered = topo_sort(selected)            # by depends_on
    phased = group_by_phase(ordered)         # day-1, week-1, ...
    for phase in phased:
        phase.modules.sort(key=lambda m: m.order)
    gaps += check_phase_ordering(phased)     # dep in later phase = gap
    return Plan(phased=phased, gaps=gaps)
```

---

## 5. Variable substitution (deterministic, no AI)

Exact values that must never be invented. Simple `{{token}}` replacement done in Python before any AI step.

| Token | Source | Example |
|-------|--------|---------|
| `{{name}}` | input | Charlie |
| `{{first_name}}` | derived | Charlie |
| `{{role}}` | input | Ads Specialist |
| `{{account}}` | input | Acme Retail |
| `{{manager}}` | roles/account config | Jordan Lee |
| `{{start_date}}` | input | 2026-07-01 |
| `{{buddy}}` | account config (optional) | Sam Cruz |

Rule: if a token has no value, the build **fails loudly** (or flags a gap) rather than emitting a literal `{{manager}}` into a new hire's guide.

---

## 6. AI adaptation layer (cached + human-reviewed)

### 6.1 What it does
For modules flagged `adaptive: true`, the AI rewrites **tone/framing only** (not facts) for a given audience profile — e.g., junior vs. senior, technical vs. non-technical. The canonical approved text is the source of truth.

### 6.2 Cache-first flow (the safety story)
1. **Generate** (offline, on demand): a `generate_variants` command calls the API (OpenAI or Anthropic — provider-agnostic, same pattern as Drift) to draft variants for each `(module, audience_profile)`.
2. **Review**: variants are written to `variants/<module_id>/<profile>.md` with status `pending`. A human reads and either approves (moves to `approved`) or edits.
3. **Compile**: the compiler **only ever reads `approved` variants**. If an approved variant for the needed profile doesn't exist, it **falls back to the canonical module text** (never calls the API live during a hire's build, never ships unreviewed text).

### 6.3 Guardrails
- AI prompt is constrained to rephrasing supplied text; instructed not to add facts, names, links, or steps.
- A diff/lint check can flag variants that introduce new URLs or proper nouns not in the source (optional v2).
- Audience profiles are a closed set: `{junior, senior} × {technical, non-technical}` (4 profiles), keeping the cache small and reviewable.

---

## 7. Gap & consistency checking (the "Drift-style" value-add)

Onboard reports problems instead of hiding them. On every build it emits a **gap report**:

- **Missing dependency** — a module depends on one not included for this role/account.
- **Sequencing gap** — a dependency is scheduled in a later phase than the module needing it.
- **Unmapped role/account** — role or account has no modules at all (likely a config omission).
- **Empty phase** — a phase has no content (may be intentional; flagged as info).
- **Missing variable** — a required token has no value.
- **Unapproved/missing variant** — `adaptive` module fell back to canonical because no approved variant existed (info-level, not an error).

Severity levels: `error` (blocks build), `warning` (builds, flagged), `info`. Mirrors Drift's restraint: only flag what matters, ranked by severity.

---

## 8. Configuration schema

### 8.1 `modules.yaml`
```yaml
modules:
  - id: welcome-and-mission
    file: welcome-and-mission.md
    universal: true
    phase: day-1
    order: 10
    adaptive: true

  - id: platform-access
    file: platform-access.md
    applies_to: [ads-specialist, analyst]
    phase: day-1
    order: 20

  - id: campaign-naming-conventions
    file: campaign-naming-conventions.md
    applies_to: [ads-specialist, analyst, account-manager]
    phase: week-1
    order: 20
    depends_on: [platform-access]
    adaptive: true

  - id: acme-brand-guidelines
    file: accounts/acme-brand-guidelines.md
    account_scope: [acme-retail]
    phase: week-1
    order: 50
```

Field reference:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | Unique key |
| `file` | path | yes | Relative to `/docs/onboarding/` |
| `universal` | bool | no | Default false |
| `applies_to` | list[role] | no | Roles that need it |
| `account_scope` | list[account] | no | Accounts that inject it |
| `phase` | enum | yes | day-1 / week-1 / week-2 / week-3-plus |
| `order` | int | yes | Sort within phase |
| `depends_on` | list[id] | no | Must resolve to included modules |
| `adaptive` | bool | no | Eligible for AI phrasing variants |

### 8.2 `roles.yaml`
```yaml
roles:
  ads-specialist:
    label: "Ads Specialist"
    default_manager: "Jordan Lee"
  analyst:
    label: "Analyst"
    default_manager: "Priya Nair"
```

### 8.3 `accounts.yaml`
```yaml
accounts:
  acme-retail:
    label: "Acme Retail"
    manager: "Jordan Lee"
    buddy: "Sam Cruz"
```

---

## 9. CLI interface

```bash
# Build a plan for one hire
onboard build \
  --name "Charlie" \
  --role ads-specialist \
  --account acme-retail \
  --seniority junior \
  --start-date 2026-07-01 \
  --out ./output/

# Generate AI phrasing variants for review (offline)
onboard generate-variants --module campaign-naming-conventions

# Validate config + content without building (CI-friendly)
onboard check
```

Outputs to `--out`:
- `Day_1_Guide.md` — assembled markdown
- `Day_1_Guide.pdf` — branded PDF
- `gap_report.md` — consistency findings

---

## 10. File / repo layout

```
onboard/
├── docs/onboarding/            # approved canonical content (markdown)
│   ├── welcome-and-mission.md
│   ├── platform-access.md
│   ├── campaign-naming-conventions.md
│   └── accounts/
│       └── acme-brand-guidelines.md
├── variants/                   # AI-drafted, human-approved phrasing
│   └── campaign-naming-conventions/
│       ├── junior-technical.md      # status: approved | pending
│       └── senior-technical.md
├── config/
│   ├── modules.yaml
│   ├── roles.yaml
│   └── accounts.yaml
├── src/
│   ├── resolve.py              # selection + sort + phase grouping
│   ├── substitute.py           # variable injection
│   ├── adapt.py                # variant selection + API generation
│   ├── gaps.py                 # consistency checks
│   ├── render.py               # markdown -> PDF
│   └── cli.py
├── output/
└── SPEC.md
```

---

## 11. Tech stack

- **Python** — compiler, CLI (`argparse` or `click`).
- **PyYAML** — config parsing.
- **Markdown + WeasyPrint** (or `md-to-pdf` / pandoc) — branded PDF rendering with a CSS theme (lime `#B6FF3C` accent to match portfolio).
- **OpenAI / Anthropic API** — provider-agnostic adaptation (same abstraction as Drift), used only in `generate-variants`.

---

## 12. Build phases (suggested order of work)

1. **Resolver core** — `modules.yaml` + `resolve.py`: selection, dedupe, topo sort, phase grouping. Output plain markdown. (This alone is a working tool.)
2. **Variable substitution** — `substitute.py` + roles/accounts config.
3. **PDF rendering** — `render.py` + branded CSS theme.
4. **Gap checker** — `gaps.py` + `gap_report.md`. (Big differentiator; do before AI.)
5. **AI adaptation** — `adapt.py` generate-variants + cached approved selection.
6. **Polish** — `onboard check` for CI, README, sample data set.

Phases 1–4 give a portfolio-ready tool with no AI dependency; phase 5 adds the judgment layer.

---

## 13. Portfolio framing

Three demonstrable claims, each beyond string concatenation:
1. **Role + account resolution** — same input → different correct plan.
2. **Dependency-aware sequencing** — modules land in a logical teaching order, with gaps surfaced.
3. **Trainee-aware phrasing** — AI adapts delivery, human approves, compiler ships only vetted text.

Narrative fit: *Spot → Build → Save*. Spot — managers rebuild onboarding by hand each time. Build — a config-driven plan compiler with a safety-first AI layer. Save — minutes-not-hours per hire, plus consistency the manual process can't guarantee.
