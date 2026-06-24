/**
 * Case study / project data.
 * All copy is verbatim from the spec. Bracketed items are owner placeholders.
 */

export interface Project {
  slug: string
  title: string
  result: string
  problem: string
  whatIBuilt: string
  mediaPlaceholder: string
  /** Optional screenshot/example for the "See it in action" section. Lives in /public. */
  mediaImage?: string
  /** Alt text for mediaImage. */
  mediaAlt?: string
  /** Optional demo video for the "See it in action" section. Lives in /public. Takes priority over mediaImage. */
  mediaVideo?: string
  theResult: string
  tools: string[]
  whatILearned: string
}

export const projects: Project[] = [
  {
    slug: 'onboard',
    title: 'Onboard — Custom Day-1 Plan Builder',
    result:
      `Builds a personalized, sequenced onboarding plan for every new hire — right role, right account, right order — in seconds, and flags anything missing before it reaches them.`,
    problem:
      `Every time someone new starts, a manager rebuilds onboarding by hand — gathering the right getting-started docs, tailoring them to the person's role and the account they're joining, and pasting in names and dates. It's slow, it's done from memory, and it's inconsistent: two analysts joining the same week get different guides depending on who assembled them and what got forgotten. The gaps don't announce themselves — a missing access step or a topic taught before its prerequisite only surfaces once the new hire is already stuck.`,
    whatIBuilt:
      `A config-driven tool that compiles a tailored onboarding plan from a library of approved markdown topics. You give it a name, role, account, and start date; it resolves which topics that person actually needs — universal ones, role-specific ones, account-specific ones — dedupes them, sorts them by dependency, and groups them into a phased plan (Day 1 → Week 1 → Week 2 → Week 3+). It injects exact personal details deterministically, so a name or manager is never guessed, and renders a branded PDF plus a markdown source.\n\nI built it around one principle carried over from my last project: let the deterministic layer own correctness, and apply judgment only where it adds value. The selection, sequencing, and detail-injection are all exact and rule-based — no AI deciding who gets what. On top sits a gap checker that does the opposite of hiding problems: it reports missing dependencies, out-of-order topics, and unmapped roles, and for serious issues it stops the build rather than handing someone a confidently incomplete guide. It only flags what genuinely warrants attention, so it never cries wolf.`,
    mediaPlaceholder:
      '(demo placeholder)',
    mediaVideo: '/Onboard-demo.mp4',
    theResult:
      `The same system produces demonstrably different, correct plans from different inputs — an analyst's plan surfaces SQL and reporting topics while an ads specialist's surfaces campaign setup and trafficking, with the shared essentials held constant. What used to be a from-memory assembly job per hire becomes a few seconds of resolved, consistent output. And because the gap checker runs on every build, the plan a new hire receives is either complete or visibly blocked with the reason — the silent half-right guide is no longer a possible outcome.`,
    tools: ['Python', 'YAML-driven config', 'Markdown', 'WeasyPrint (branded PDF)', 'Claude Code'],
    whatILearned:
      `The hardest part wasn't generating content — it was deciding what not to automate. The instinct is to let AI write the whole plan, but onboarding is exactly where a plausible-sounding wrong fact ("your access request goes to the wrong team") does real damage. Drawing a hard line — deterministic structure and facts, AI reserved only for adaptation later — made the tool more trustworthy, not less capable.\n\nI also learned that the value of a tool like this is invisible in a single output. One nice PDF proves nothing; the intelligence only shows in the contrast between two runs and in the gap report catching what a human would miss. Designing the tool to make its own judgment visible — same input, different correct output; problems surfaced instead of buried — turned out to matter as much as the logic underneath.`,
  },
  {
    slug: 'drift',
    title: 'Drift — Personal Engagement-Awareness Tool',
    result:
      `Catches scope, coordination, and effort problems while they're still small — across every account, in one view.`,
    problem:
      `Managing several accounts at once, things slide gradually — a scope nudge here, a stalled hand-off there, hours quietly piling onto a low-priority client. Each is small, none trips an alarm, and together they cost you control. You usually notice too late, often when someone else does.`,
    whatIBuilt:
      `A spreadsheet-based tool that watches the gap between what was agreed and what's actually happening, then flags where things are drifting. I built it around one idea: scope creep, coordination breakdowns, and resource misallocation are all the same motion — drift from an agreed baseline — so I unified them under three lenses (scope, coordination, effort). Claude reads each account against its baseline and writes back what's drifting, how serious it is, and a suggested next move. I designed the diagnostic logic, the severity ranking, and — most importantly — the restraint: it only elevates what genuinely warrants attention, so it never cries wolf.`,
    mediaPlaceholder:
      `[Add a 60–90 second screen recording: the account board with drift surfacing across three accounts, an on-track account staying quiet, then generating a check-in summary — ending on the tool recognizing a current account matches an archived one and pulling forward the lesson.]`,
    mediaVideo: '/Drift-demo.mp4',
    theResult:
      `Turns a scattered, half-tracked week into a calm, ranked view of exactly where things stand and what to act on first. The payoff isn't just time saved — it's walking into any check-in already knowing what's drifting and what I'm doing about it, instead of being caught flat.`,
    tools: ['Claude', 'Google Sheets', 'Apps Script'],
    whatILearned:
      `The hardest design choices weren't technical — they were restraint and honesty. A tool that flags everything gets ignored, so teaching it to stay quiet when things are fine mattered as much as teaching it to catch problems. And rather than claim "the AI learns about you," I built memory into the spreadsheet itself — it accumulates history the AI reasons over — which is both more honest and easier to explain than implying the model trains on your data.`,
  },
  {
    slug: 'content-repurposer',
    title: 'Content Repurposer',
    result: 'Turns one piece of content into a set of platform-ready posts.',
    problem:
      'A single blog post or long caption could be reused across LinkedIn, Instagram, X, and email — but rewriting it for each platform\'s style and length by hand took real time, and it was easy to lose the original point along the way.',
    whatIBuilt:
      'A Claude-powered tool where I drop in one piece of content and get back versions tailored to each platform — adjusted for length, tone, and format. I set the rules for what each platform\'s version should look like so the output respects each channel\'s norms. Claude adapts the writing; I defined the guardrails.',
    mediaPlaceholder:
      '[Add a before/after example: one source post, then the set of platform versions side by side.]',
    mediaImage: '/content-repurposer-demo.png',
    mediaAlt:
      'The Content Repurposer tool: a blog post about a community greenhouse project on the left, turned into platform-ready LinkedIn and Instagram posts on the right.',
    theResult:
      'Reduced repurposing one piece of content from [~25 minutes] to a few minutes, while keeping the core message intact across every version.',
    tools: ['Claude'],
    whatILearned:
      'The tricky part was keeping each version distinct without drifting from the original message. Giving Claude clear per-platform rules — rather than asking it to "make it shorter" — kept the outputs both on-brand and genuinely different from each other.',
  },
]
