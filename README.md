# todo-change

A browser-based todo app with no backend, built entirely by AI, one spec at a
time. Data lives in `localStorage`.

This repo is a demonstration of spec-driven development: each version of the app
is one written spec, one implementation step, one commit, one screenshot.

- The process and the rules: [CLAUDE.md](CLAUDE.md)
- The specs, in order: [specs/](specs/)
- Problems found while testing: [GitHub Issues](https://github.com/sargismarkosyan/todo-change/issues)
- The screenshot series: [docs/screenshots/](docs/screenshots/)

Feedback is given by talking to Claude, not by writing issues by hand — the
[`feedback` skill](.claude/skills/feedback/SKILL.md) turns a testing session into
researched issues.

## Run it

Open `index.html` in a browser, or:

```sh
python3 -m http.server 8000
```
