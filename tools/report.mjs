#!/usr/bin/env node
// Builds the markdown report CI posts on a pull request.
//
// This is a reporting tool, not a gate. It runs after `npm run trace` and
// `npm test` have already passed, and it deliberately recomputes neither:
// traceability is proven by the gate having passed, so this only counts and
// compares. Nothing here can fail a build.
//
// The comparison column is the same numbers computed against the base branch,
// read from a throwaway worktree. gherkin.mjs has no dependencies, so that
// costs a shallow fetch and no install.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadFeatures } from './gherkin.mjs';

const BASE_REF = process.env.BASE_REF || 'main';
const LCOV_FILE = 'coverage/lcov.info';
const THRESHOLD = 95;

const git = (args, cwd = '.') =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

/** Every *.test.mjs under `dir`, split by kind. */
function countTests(root) {
  const found = [];
  const walk = (current) => {
    for (const entry of readdirSync(current).sort()) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.test.mjs')) found.push(full);
    }
  };
  try {
    walk(root);
  } catch {
    return { behaviour: 0, unit: 0 };
  }
  return {
    behaviour: found.filter((f) => f.includes(`${join('tests', 'behaviour')}`)).length,
    unit: found.filter((f) => f.includes(`${join('tests', 'unit')}`)).length,
  };
}

/** The numbers this report is about, for one checkout. */
function measure(root) {
  const { features, rulesById } = loadFeatures(join(root, 'specs', 'features'));
  const rules = [...rulesById.values()];
  return {
    features: features.length,
    live: rules.filter((r) => !r.planned).length,
    planned: rules.filter((r) => r.planned),
    ...countTests(join(root, 'tests')),
  };
}

/** LF/LH, BRF/BRH, FNF/FNH summed across every file in the lcov record. */
function coverage(file) {
  if (!existsSync(file)) return null;
  const totals = { LF: 0, LH: 0, BRF: 0, BRH: 0, FNF: 0, FNH: 0 };
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const [key, value] = line.split(':');
    if (key in totals) totals[key] += Number(value) || 0;
  }
  const row = (hit, found) => ({ hit, found, pct: found === 0 ? 100 : (hit / found) * 100 });
  return {
    Lines: row(totals.LH, totals.LF),
    Branches: row(totals.BRH, totals.BRF),
    Functions: row(totals.FNH, totals.FNF),
  };
}

/** The base branch in a throwaway worktree, or null when it cannot be reached. */
function withBaseline(fn) {
  let dir = null;
  try {
    dir = mkdtempSync(join(tmpdir(), 'todo-change-base-'));
    git(['fetch', '--depth=1', 'origin', BASE_REF]);
    git(['worktree', 'add', '--detach', dir, 'FETCH_HEAD']);
    return fn(measure(dir));
  } catch {
    return fn(null);
  } finally {
    if (dir) {
      try {
        git(['worktree', 'remove', '--force', dir]);
      } catch {
        /* a leftover temp dir is not worth failing a report over */
      }
    }
  }
}

const delta = (before, after) => {
  if (before === null || before === undefined) return '';
  const d = after - before;
  return d === 0 ? '–' : d > 0 ? `+${d}` : `${d}`;
};

const out = [];
const now = measure('.');

withBaseline((base) => {
  out.push('## Spec health', '');
  out.push(`| | \`${BASE_REF}\` | this branch | |`);
  out.push('| --- | ---: | ---: | :--- |');
  const rows = [
    ['Live rules', base?.live, now.live],
    ['Planned rules', base?.planned.length, now.planned.length],
    ['Feature files', base?.features, now.features],
    ['Behaviour test files', base?.behaviour, now.behaviour],
    ['Unit test files', base?.unit, now.unit],
  ];
  for (const [label, before, after] of rows) {
    out.push(`| ${label} | ${before ?? '–'} | ${after} | ${delta(before, after)} |`);
  }
  out.push('');
  if (!base) {
    out.push(`> Could not read \`${BASE_REF}\` to compare against; showing this branch only.`, '');
  }
});

out.push(
  `All ${now.live} live rules are traced to a test — the traceability gate passed, ` +
    'which is exactly what that means.',
  '',
);

if (now.planned.length > 0) {
  out.push('### Specced but not built', '');
  out.push('Tagged `@planned`. These are exempt from needing a test until the tag comes off:', '');
  for (const rule of now.planned.sort((a, b) => a.id.localeCompare(b.id))) {
    out.push(`- \`${rule.id}\` — ${rule.name}  <br>\`${rule.path}\``);
  }
  out.push('');
} else {
  out.push('Nothing is left tagged `@planned` — every written rule is built and tested.', '');
}

const cov = coverage(LCOV_FILE);
out.push('## Coverage', '');
if (cov) {
  out.push('| | % | hit / total |', '| --- | ---: | ---: |');
  for (const [label, { hit, found, pct }] of Object.entries(cov)) {
    const mark = pct + 1e-9 >= THRESHOLD ? '' : ' ⚠️';
    out.push(`| ${label} | ${pct.toFixed(2)}${mark} | ${hit} / ${found} |`);
  }
  out.push('', `Gate is ${THRESHOLD}% on all three.`, '');
} else {
  out.push(`No coverage data at \`${LCOV_FILE}\`.`, '');
}

out.push('<sub>Posted by `tools/report.mjs`. Reporting only — it cannot fail a build.</sub>');
console.log(out.join('\n'));
