# todo-change

A browser-based recipe book with no backend, built entirely by AI, one spec at
a time. Data lives in `localStorage`.

It was a todo app for its first three versions. What it is now, and why it
stopped being one, is [spec 0004](specs/changes/0004-recipe-book.md).

This repo is a demonstration of spec-driven development: each version of the app
is one written spec, one implementation step, one commit, one recording.

**Live:** <https://sargismarkosyan.github.io/todo-change/>

## How it fits together

Prose specs say why. [Gherkin](https://cucumber.io/docs/gherkin/) feature files
say what must be true. Tests point back at the Gherkin rules by id, and CI
refuses the build unless every rule has a test, every behaviour test has a rule,
and coverage clears 95%.

- How this repo works, in full: [specs/setup/](specs/setup/README.md)
- The short version: [CLAUDE.md](CLAUDE.md)
- How specs are structured: [specs/README.md](specs/README.md)
- Who the app is for: [specs/persona.md](specs/persona.md)
- Problems found while testing: [GitHub Issues](https://github.com/sargismarkosyan/todo-change/issues)
- The series, one animated GIF per version: [docs/screenshots/](docs/screenshots/)

Feedback is given by talking to Claude, not by writing issues by hand — the
[`feedback` skill](.claude/skills/feedback/SKILL.md) turns a testing session into
researched issues.

## Run it

```sh
npm run serve      # http://localhost:8000
```

It needs the server. The app is ES modules, and a module's `import` is a fetch
that `file://` blocks — opening `index.html` from disk gives you the page with
nothing wired up.

## Check it

```sh
npm install
npm run verify     # traceability + tests + coverage gate
```
