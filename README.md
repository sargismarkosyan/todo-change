# todo-change

A browser-based todo app with no backend, built entirely by AI, one spec at a
time. Data lives in `localStorage`.

This repo is a demonstration of spec-driven development: each version of the app
is one written spec, one implementation step, one commit, one screenshot.

**Live:** <https://sargismarkosyan.github.io/todo-change/>

## How it fits together

Prose specs say why. [Gherkin](https://cucumber.io/docs/gherkin/) feature files
say what must be true. Tests point back at the Gherkin rules by id, and CI
refuses the build unless every rule has a test, every behaviour test has a rule,
and coverage clears 95%.

- The process and the rules: [CLAUDE.md](CLAUDE.md)
- How specs are structured: [specs/README.md](specs/README.md)
- Problems found while testing: [GitHub Issues](https://github.com/sargismarkosyan/todo-change/issues)
- The screenshot series: [docs/screenshots/](docs/screenshots/)

Feedback is given by talking to Claude, not by writing issues by hand — the
[`feedback` skill](.claude/skills/feedback/SKILL.md) turns a testing session into
researched issues.

## Run it

```sh
npm run serve      # http://localhost:8000
```

Or just open `index.html`.

## Check it

```sh
npm install
npm run verify     # traceability + tests + coverage gate
```
