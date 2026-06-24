# Drift — Personal Engagement-Awareness Tool

Catches scope, coordination, and effort problems while they're still small —
across every account, in one view.

> **No source in this repo.** Drift runs as a Google Sheet + Apps Script project
> in my own Google account. This README is a **design document**: it explains how
> it works and what has been redacted, without exposing the script, credentials,
> or any client data. (The portfolio site shows a screen recording of it running.)

## Runtime
- **Google Sheets** — the data surface and the tool's memory.
- **Google Apps Script** — the logic layer (triggers, the OpenAI call, writing
  results back into the sheet).
- **OpenAI API** — called server-side from Apps Script to reason over each account
  against its baseline.

## The problem
Managing several accounts at once, things slide gradually — a scope nudge here, a
stalled hand-off there, hours quietly piling onto a low-priority client. Each is
small, none trips an alarm, and together they cost you control. You usually notice
too late, often when someone else does.

## Design
One idea underpins it: scope creep, coordination breakdowns, and resource
misallocation are all the same motion — **drift from an agreed baseline** — so they
are unified under three lenses: **scope, coordination, effort**. For each account,
the model reads the current state against its baseline and writes back what's
drifting, how serious it is, and a suggested next move.

Two deliberate design choices do most of the work:
- **Severity ranking + restraint.** It only elevates what genuinely warrants
  attention, so it never cries wolf. A tool that flags everything gets ignored.
- **Memory lives in the spreadsheet, not the model.** Rather than claiming "the AI
  learns about you," history accumulates in the sheet itself and the model reasons
  over it each run — more honest and easier to explain than implying the model
  trains on your data.

## The result
Turns a scattered, half-tracked week into a calm, ranked view of exactly where
things stand and what to act on first. The payoff isn't just time saved — it's
walking into any check-in already knowing what's drifting and what you're doing
about it.

## Limitations
- Single-user, single-spreadsheet; not a multi-tenant product.
- Quality of the drift read depends on the baselines being kept current.
- The OpenAI call is best-effort; if the API is unavailable, the sheet still shows
  the last computed state.

## What's redacted (and why)
Not included in this repo, intentionally:
- **The Apps Script source** — it's tied to a specific Google project/account.
- **The OpenAI API key** — lives in the Apps Script project's *Script Properties*,
  never in code or this repo.
- **All account/client data and baselines** — real engagement data is private.

What you *can* see here is the design and the demo recording on the site.
