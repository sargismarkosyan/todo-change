# Setup

How this repository works — the process, the structure, the gates, and the
skills. Everything here is prose. None of it is testable, which is why it lives
in markdown and not in `.feature` files.

`CLAUDE.md` is the short version. This folder is the long one.

## If you are starting fresh, read in this order

1. **[process.md](process.md)** — the development loop, and the rules that fall
   out of it. Read this first; nothing else makes sense without it.
2. **[repository.md](repository.md)** — what lives where, and the git/GitHub
   conventions.
3. **[constraints.md](constraints.md)** — the technical constraints and the
   reasoning behind each. These are decisions, not defaults.
4. **[pipeline.md](pipeline.md)** — the gates, how they work, and how to fix
   them when they fail.
5. **[testing.md](testing.md)** — how to write a test that the pipeline accepts.
6. **[skills.md](skills.md)** — the two project skills and when each fires.

Then read [`../README.md`](../README.md) for how the spec layers fit together,
and [`../personas/`](../personas/README.md) and
[`../workflows/`](../workflows/README.md) for who the app is for and what they
do with it.

## The one-paragraph version

`todo-change` is a test bed for spec-driven development. A human uses the app
and reports what they find in chat; AI turns that into GitHub issues, then into
specs — prose for the why, Gherkin for what must be true — and only then into
code. Every Gherkin rule carries a stable id, every behaviour test names the
rule it answers to, and CI refuses any commit where that link is broken or
coverage drops below 95%. Each shipped spec is one version, one commit, one
screenshot.

## Changing the setup itself

These files describe decisions. Changing one is a decision about how the project
works, so it goes through the same loop as everything else: it gets a numbered
change spec in [`../changes/`](../changes/) explaining what is changing and why.

The exception is correcting something that is simply wrong — a stale path, a
command that no longer exists. Fix those directly.
