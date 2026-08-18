# Project skills

Two **process** skills live in `.claude/skills/`. They are the two halves of the
loop that happen before any code is written: turning a report into issues, and
turning a request into a spec. A repository may carry other skills of its own;
these two are the ones the process depends on.

Both are invocable as `/<name>` and both fire on their own when the conversation
matches. **Neither writes application code.** That is deliberate — the moment a
skill can both decide what to build and build it, the approval step in
[process.md](process.md) stops existing.

A fresh session picks skills up automatically. If `/refine-spec` or `/feedback`
is not offered, the session started before the file existed — restart it.

---

## `refine-spec`

`.claude/skills/refine-spec/SKILL.md`

**Fires when** someone asks for the app to be built, changed, added to, fixed, or
improved. Including — especially — small-sounding asks: "just add a button", "can
it also…". Also when picking up a GitHub issue.

**The premise.** A request is not a spec. Someone hands over a *solution* — "add
a search box" — with the *job* buried underneath — "I know the recipe is in
here somewhere and reading down four books to find it is slow enough that I go
back to the drawer." The proposed solution is one answer to that job, and often
not the best one.

**What it does.**

1. **Reads the fixed points first** — `persona.md`, `workflows.md`, `spec.md`,
   the existing features, the issue.
2. **Finds the job.** The literal ask, the job stated without naming any
   solution, the trigger moment, and what the person does today instead. If the
   job cannot be written without naming a UI element, it has not been found yet.
3. **Places it on the map.** Which persona, which workflow step, does it make
   writing a recipe down or browsing shorter or longer, does it collide with a
   product boundary.
4. **Works out the end value** — and how we would know it worked. Something
   observable: a workflow that got shorter, a mistake that stopped happening. If
   that cannot be named, the change is decoration and it says so.
5. **Asks only what changes the spec.** One batched round, three or four
   questions, each with a recommendation. Not an interview.
6. **Shrinks it** to the smallest version that delivers the value, and records
   the dropped alternatives so they are not relitigated later.
7. **Writes** the Gherkin rules (`@planned`) and the numbered change spec, checks
   `npm run trace`, and commits the spec on its own.
8. **Hands back a link, not a summary.** Clickable `path:line` references to the
   spec and the feature files, above them only what the file cannot say — the
   job found, what was assumed, what was dropped. Approval is asked for in one
   plain line, never as a multiple-choice question: the spec is there to be
   read, and restating it in option text just gives two versions to reconcile.
   Then it stops.

**What it never does.** Touch `src/`. Implement anything. Remove a `@planned`
tag — that happens in the implementing change.

**The enforcement is structural.** `specs/changes/TEMPLATE.md` opens with *who
this is for*, *the job behind the request*, *why now*, and *the end value*,
before it reaches what changes. A change spec that cannot fill those in is a
solution in search of a problem.

---

## `feedback`

`.claude/skills/feedback/SKILL.md`

**Fires when** the human reports something from having actually used the app — a
bug, something confusing, something missing, an "I wish it did X", or a
screenshot with a complaint attached.

**The premise.** The human is the only person who uses this app. Nothing they
noticed should be lost between their chat message and the tracker.

**What it does.**

1. **Takes the report apart.** One message is rarely one issue. It captures the
   stated complaint *and* the implicit: the expectation behind it, friction
   mentioned in passing, emotional signal ("that's weird" means the app broke a
   mental model), and what they were actually trying to accomplish. Then splits
   it — one issue = one change someone could spec.
2. **Handles screenshots.** Given a file path, it copies the image into
   `docs/feedback/`, pushes it, and embeds the raw URL. Images pasted straight
   into chat can be seen but not written to disk, so those get described
   precisely in the issue instead, with a note saying no file was attached.
3. **Investigates before filing.** Finds the responsible file and line, finds the
   spec that introduced the behaviour, and decides whether the app *violates* its
   spec or *faithfully implements a bad one* — those lead to different fixes.
   Reproduces where it can and records the actual `localStorage` value, which is
   very often the answer.
4. **Checks for duplicates**, then files with `gh issue create`.
5. **Reports back** the URLs, and says so when the cause turned out to be
   different from what the reporter assumed.

**What it never does.** Fix anything. A fix without a spec breaks the process.

**Remember who is reporting.** The human testing this repo is not the persona —
see [`../persona.md`](../persona.md). What they *find* is real: a crash is a
crash. What they *want* has to be checked against Nell before it becomes a spec.

---

## Adding a skill

`.claude/skills/<name>/SKILL.md`, with YAML frontmatter carrying `name` and a
`description` that says plainly when it should fire — the description is the only
thing a fresh session reads when deciding whether to load it.

Write the body as instructions to the agent that will run it, not as
documentation about it. Say what to do, in what order, and what never to do.
