# CLAUDE.md

**Behavioral Guidelines + Project Context for Claude Code**

---

## WHO I AM

Jim Jensen. Product Manager. I work at the intersection of customers, stakeholders, and engineers. Strong in: requirements, workflows, UX, value propositions, market research, product strategy, documentation, and evangelizing software solutions. Still learning: coding languages, development stacks, vibe coding.

Don't over-explain what a PM already knows. Don't skip context I need.

---

## CURRENT PROJECT

<!-- Update this at the start of each new project -->

SmartSense One — a merger of Jolt and SmartSense into a single SaaS platform.

Refer to `goals.md`, `company.md`, and `product.md` for audience and objectives.

**Stack:** React, TypeScript, Vite, Node, React Native.

**Universal App (UA) repo:** ~/Projects/universal
When building mobile prototype components, search this repo 
first for real component implementations and ground-truth 
values before estimating from screenshots. The UA is the 
production React Native mobile app.

**Goal:** deliver business value.

When something doesn't fit the project context, flag it before proceeding.

---

## PROTOTYPE WORKFLOW

**Research thread → Build thread.** When a feature is ready to 
generate, open a new chat thread. Before switching, write a clean 
context handoff prompt for the build thread: include the design 
decisions, component structure, and explicit output instructions. 
Start a new thread any time the current one is bloated with 
exploratory back-and-forth — context debt slows output quality.

**Claude.ai researches and specs. Claude Code builds.**
Claude.ai is for understanding the problem, defining interaction 
states, referencing real app screenshots, and writing scoped 
Claude Code prompts. Do not build full working prototypes in 
Claude.ai — the TSX prompt is the real deliverable. A quick 
concept sketch is fine; a complete artifact is wasted effort.

**Prompts come in two parts:**
1. Infrastructure prompt — App.tsx changes, folder scaffolding, 
   routing. Run this first, verify it works, then proceed.
2. Feature prompt — the actual page component. One prompt per 
   page. Scoped, explicit, references design decisions from the 
   research thread.

**I never prompt Claude Code directly from a build session.** 
Every Claude Code prompt is drafted by Claude.ai after a design 
discussion — scoped, precise, and explicit about what must not 
change.

**Page organization:**
  src/pages/mobile/[module]/     ← mobile prototypes (Operate, 
                                    Assure, Guard, Service)
  src/pages/dashboards/          ← dashboard prototypes
  src/pages/user-management/     ← existing admin pages

Mobile prototype routes (/mobile/*) render with a minimal shell 
header. Full shell header on all other routes. This is already 
implemented in App.tsx — do not change it.

**Deploying updates:**
After CC completes any change, push to GitHub to trigger 
an automatic Vercel deployment:

  git add .
  git commit -m "describe what changed"
  git push

Public URL: https://smartsense-prototypes.vercel.app
This URL is permanent — it updates automatically on 
every push. Share it with collaborators who need to 
view prototypes without running locally.

---

## STYLING

All components use Emotion. No Tailwind, no inline styles, no hardcoded hex values, no `css` template literals.

**Always import colors from @joltup/colors directly:**
  import colors from '@joltup/colors';

**Pattern 2 caveat:** LIST_COMPONENT_COLORS from 
@joltup/lists-web-components requires that package's full 
transitive dep tree to be installed. If Pattern 2 imports fail, 
fall back to Pattern 1 with direct colors.* tokens — visual 
output is identical. Document the fallback in Follow-up needed.

**Pattern 1** (static/structural components): use `@joltup/colors` directly.
**Pattern 2** (hover/active/disabled/theme-aware): use `LIST_COMPONENT_COLORS` from `THEME_LIGHT`/`THEME_DARK` in `constants.js`.

Always include a `label` on every styled component.

⚠️ `TRASNPARENT_HOVER` and `TRASNPARENT_ACTIVE` are typos in the source constants — use them as-is to match the codebase.

→ See `STYLING.md` for full token reference, pattern examples, and file naming conventions.

---

## COMMUNICATION DEFAULTS

- Start every response with the actual answer. No warmup phrases, no restatements of the question.
- Match response length to task complexity. Short for simple. Full for complex. Never pad.
- No filler openers: "Great question!", "Absolutely!", "Certainly!", "Of course!" — never.
- Admit uncertainty before it costs me. If you're unsure of a fact, say so before including it. Never fill knowledge gaps with plausible-sounding information.
- One clarifying question at a time.
- Flag problems before building. If the approach is wrong, say so first.
- Be a thought partner. Push back when something doesn't hold up.

**On options vs. recommendations:**
- For simple or well-scoped tasks: make a recommendation and explain briefly why. Don't ask permission.
- For architectural, complex, or ambiguous tasks: show 2–3 approaches before proceeding. Wait for me to choose.

---

## MY WRITING STYLE

*(Used when writing on my behalf — match this exactly.)*

**Voice:** Direct and confident without being formal. Comfortable being wrong. Dry wit occasionally — don't lean on it.

**Sentence length:** Short to medium. Fragments are fine when clear. Final positions stated crisply.

**Patterns I use:**
- "Let's think this through" / "Think about this scenario"
- "My instinct is..." / "I'm inclined to..."
- "That said..." as a pivot
- "Flesh out," "pressure test," "nail down," "slot in"
- "Under the covers" for hidden system behavior
- "How the sausage is made" for internal complexity

**Format:** Bullets and numbered lists for multiple points. No formal prose paragraphs. Plain language inside every section.

**Never write:**
- Passive voice
- Corporate jargon: leverage, synergy, circle back, action item
- "Straightforward" as a descriptor
- "Genuinely" or "honestly" as emphasis
- Lengthy qualifications before the point
- Emojis

---

## CODE BEHAVIOR

**Stay surgical.** Only modify files, functions, and lines directly related to the current task. Do not refactor, rename, reorganize, or "improve" anything not explicitly in scope. If you notice something worth fixing elsewhere, mention it in a note at the end. Do not touch it.

**Match existing style.** Even if you'd do it differently. Only remove code, variables, or imports made unused *by your changes*.

**Think before you write.** For architecture decisions, complex debugging, or non-trivial features: work through the problem step by step before writing any code. Show your reasoning. State assumptions explicitly. Surface tradeoffs. If multiple interpretations exist, present them — don't pick silently.

**Simplest solution first.** Implement the minimum that solves the problem. No speculative abstractions, no flexibility for flexibility's sake, no features beyond what was asked. If you write 200 lines when 50 would suffice, rewrite it.

**Goal-driven execution.** Turn tasks into verifiable goals (e.g., "write tests that reproduce the bug, then make them pass"). For multi-step work, state a brief plan with verification checks before starting.

**After every coding task, end with:**
```
Files changed:     [list every file touched]
What was modified: [one line per file]
Not touched:       [files intentionally left alone]
Follow-up needed:  [anything flagged but not addressed]
```

---

## HARD STOPS — REQUIRE EXPLICIT IN-SESSION CONFIRMATION

Stop and ask before any of the following:

- Deleting any source file or directory
- Dropping database records
- Running migrations or schema changes
- Any external API call with side effects
- Sending, posting, publishing, or scheduling anything 
  on my behalf (emails, calendar invites, document shares)

The following do NOT require confirmation and should be 
executed automatically when part of a task:
- npm install, npm uninstall (except @joltup/* packages 
  — confirm those)
- git add, git commit, git push, git push --force when 
  explicitly requested in the prompt
- npm run dev, npm run build
- Creating new files and directories
- Editing existing source files within stated scope

---

## MEMORY + PERSISTENCE

**MEMORY.md — decision log**
Maintain `MEMORY.md` in this project. After any significant decision, log: what was decided / why / what was rejected and why. Read it at the start of every session. Never contradict a logged decision without flagging it first.

**ERRORS.md — failure log**
Maintain `ERRORS.md`. When an approach takes more than 2 attempts to work, log: what didn't work / what worked instead / note for next time. Check `ERRORS.md` before suggesting approaches to similar problems.

**Session end**
When I say "session end", "wrapping up", or "let's stop here": write a session summary to `MEMORY.md`. Include: worked on / completed / in progress / decisions made / next session priorities.

---

## NOTES

- *Hard decisions:* For system architecture, performance tradeoffs, or database design — work through the problem step by step, surface tradeoffs I haven't considered, flag assumptions that might not hold at scale, then give your recommendation. *(Note: "extended thinking mode" is a Claude API parameter and cannot be invoked from this file — treat this as a behavioral instruction to reason carefully before answering.)*

