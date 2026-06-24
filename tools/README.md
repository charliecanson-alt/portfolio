# Tools

These are the automations featured as case studies on the portfolio site. **They
run in their own runtimes — not inside the website.** The site only *describes*
them (and, for the Content Repurposer, embeds a live browser widget). Each tool's
folder explains how it actually runs and what (if anything) has been redacted.

| Tool | Runtime | AI usage | Code in this repo? |
|---|---|---|---|
| [drift](drift/README.md) | Google Sheets + Apps Script | OpenAI (server-side, in Apps Script) | No — design doc only (source lives in the Apps Script project) |
| [content-repurposer](content-repurposer/README.md) | React widget in the site | Bring-your-own-key, browser → provider | Yes — `src/pages/SpecPage.tsx` |
| [onboard](onboard/README.md) | Python CLI | None in the shipped build; OpenAI only in the future `generate-variants` step | Yes — full source vendored here |

**Why they're separate runtimes:** the site is a static frontend with no backend.
It can't safely hold a private API key, so anything that needs one either runs
elsewhere (Drift, in Apps Script) or asks the visitor for their own key
(Content Repurposer). Onboard is a local CLI you run yourself.

See the root [`.env.example`](../.env.example) for the full key surface — and note
the **site itself needs no keys**.
