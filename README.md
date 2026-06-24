# Portfolio

A personal portfolio site for someone transitioning into AI & automation, plus the
source and design docs for the automations it showcases — all in one repo.

The **site** is a single-page React app with routed case-study pages. The **tools**
it features live under [`tools/`](tools/README.md); they run in their own runtimes,
not inside the website (one of them, the Content Repurposer, also embeds a live
browser widget in the site).

## Repository structure

```
portfolio/
├── README.md              ← you are here
├── .gitignore             ← node_modules, dist, .env*, .venv, Python caches, onboard output
├── .env.example           ← which keys exist (the site itself needs none)
├── index.html, vite.config.ts, package.json, ...   ← Vite/React site config
├── public/                ← static assets (demo videos, images)
├── src/                   ← site source (components, pages, data)
└── tools/                 ← the featured automations
    ├── README.md          ← overview: each tool's runtime
    ├── drift/             ← Apps Script + OpenAI — design doc only (no source)
    ├── content-repurposer/← React widget (code in src/pages/SpecPage.tsx); BYOK
    └── onboard/           ← Python CLI — full source vendored here
```

## Tech stack (site)
- **React** (Vite) + **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animations), **Lucide React** (icons), **Radix UI** primitives

## Running the site locally
```bash
npm install
npm run dev      # dev server (http://localhost:5173)
npm run build    # production build
```
> On Windows PowerShell, if `npm` is blocked by the execution policy, use
> `npm.cmd run dev` or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

**No API keys are required to build or run the site.** The live Content Repurposer
demo is bring-your-own-key (the visitor enters their own, stored only in their
browser). See [`.env.example`](.env.example) for the full key surface.

## The tools
See [`tools/README.md`](tools/README.md). In short:
- **[Onboard](tools/onboard/README.md)** — Python CLI that compiles a role/account-aware onboarding plan (markdown + branded PDF) with a gap checker. Full source vendored; run it from `tools/onboard/`.
- **[Drift](tools/drift/README.md)** — Google Sheets + Apps Script engagement-awareness tool. Design doc only; source and data are private/redacted.
- **[Content Repurposer](tools/content-repurposer/README.md)** — the live React widget in this site; turns one post into platform-ready versions, browser → AI provider, BYOK.

## Content placeholders (before deploying)
Replace the `[placeholder]` text/links across the codebase with real content:

- **Global:** `[Your Name]` in `index.html`, `src/components/Navbar.tsx`, `src/components/Footer.tsx`
- **Proof bar** (`src/components/ProofBar.tsx`): `[X]` automations built, `[~X]` hrs/month saved, `[X]` yrs in digital advertising
- **Contact** (`src/components/Contact.tsx`): email (`mailto:` + visible text), LinkedIn link, GitHub link
- **Tools & stack** (`src/components/ToolsStack.tsx`): adjust the listed tools if needed
