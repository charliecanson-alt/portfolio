# Content Repurposer

Turns one piece of content into platform-ready posts (LinkedIn, Instagram, X
single + thread, and an email newsletter), while preserving a defined core
message and refusing to invent facts not present in the source.

Unlike the other two tools, this one **runs inside the portfolio site** as an
interactive React widget — it's the only tool a visitor can actually operate live.

## Where the code is
- Widget + all logic: [`src/pages/SpecPage.tsx`](../../src/pages/SpecPage.tsx)
- Reachable from the case study at `/work/content-repurposer` → "Try the live tool demo".

## Runtime: bring-your-own-key (BYOK), browser → provider
The site is a static frontend with no backend, so it cannot safely embed a private
API key. Instead the visitor supplies their own, and the call goes **directly from
their browser to the AI provider** — nothing passes through a server of mine.

Supported providers (pick one in the UI):

| Provider | Endpoint | Model | Auth |
|---|---|---|---|
| Anthropic | `api.anthropic.com/v1/messages` | `claude-3-haiku-20240307` | `x-api-key` + `anthropic-dangerously-allow-browser: true` |
| OpenAI | `api.openai.com/v1/chat/completions` | `gpt-4o-mini` | `Authorization: Bearer` |
| Gemini | `generativelanguage.googleapis.com/...:generateContent` | `gemini-1.5-flash-latest` | `?key=` query param |

The flow: assemble a strict prompt from the form inputs (core message, source
type, brand voice, CTA, source content) → `fetch` the chosen provider → parse the
JSON response → render the per-platform output cards.

## Key safety
- The key is saved **only in the visitor's own browser** (`localStorage`,
  per-provider), never transmitted anywhere except to the provider.
- A **"Clear key"** control wipes it from both the field and `localStorage`.
- The UI explains all of this in a "Why do you need an API key?" panel.

There are no secrets in this repo for this tool — by design, there's nothing to
redact, because no key is ever stored server-side or in the code.

## Prompt design (the actual value)
The interesting part isn't the API plumbing, it's the guardrails baked into the
prompt: a hard "use only facts present in the source" rule, per-platform length
and format constraints, a first-line concreteness rule, a single shared CTA across
versions, and a self-verification pass. The model adapts the writing; the prompt
defines what "correct" output looks like.
