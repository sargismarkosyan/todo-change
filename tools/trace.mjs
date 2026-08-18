#!/usr/bin/env node
// Traceability gate.
//
// Coverage alone rewards tests that touch code without asserting anything
// meaningful. This gate closes that loop from both ends:
//
//   rule  -> test   every Rule in specs/features must be claimed by a test
//   test  -> rule   every behaviour test must say which Rule it is there for
//
// Unit tests are exempt from the second direction: they test internals that no
// Rule describes. Everything else must point at a Rule.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { loadFeatures } from './gherkin.mjs';

const TESTS_DIR = 'tests';
const UNIT_DIR = join(TESTS_DIR, 'unit');
const SUPPORT_DIR = join(TESTS_DIR, 'support');

const errors = [];
const warnings = [];

function listTestFiles(dir = TESTS_DIR) {
  const found = [];
  const walk = (current) => {
    for (const entry of readdirSync(current).sort()) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.test.mjs')) found.push(full);
    }
  };
  try {
    walk(dir);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return found;
}

/** Rule ids claimed by a test file, via `rule('some-id', ...)`. */
function claimedRules(source) {
  return [...source.matchAll(/\brule\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
}

/** `test(` / `it(` at the start of a line — i.e. not nested inside a rule block. */
function topLevelTests(source) {
  return [...source.matchAll(/^(?:test|it)\(/gm)].length;
}

const { features, rulesById, errors: specErrors, warnings: specWarnings } = loadFeatures();
errors.push(...specErrors);
warnings.push(...specWarnings);

const testFiles = listTestFiles();
const behaviourFiles = testFiles.filter(
  (f) => !f.startsWith(UNIT_DIR) && !f.startsWith(SUPPORT_DIR),
);
const unitFiles = testFiles.filter((f) => f.startsWith(UNIT_DIR));

/** rule id -> test files claiming it */
const claims = new Map();

for (const file of behaviourFiles) {
  const source = readFileSync(file, 'utf8');
  const claimed = claimedRules(source);

  if (claimed.length === 0) {
    errors.push(
      `${file}: no rule() block — every behaviour test must name the Rule it covers ` +
        `(put a unit test in ${UNIT_DIR}/ if it does not belong to one)`,
    );
  }
  for (const id of claimed) {
    if (!rulesById.has(id)) {
      errors.push(`${file}: claims rule "${id}", which no @rule: tag in specs/features declares`);
      continue;
    }
    if (!claims.has(id)) claims.set(id, []);
    claims.get(id).push(file);
  }

  const stray = topLevelTests(source);
  if (stray > 0) {
    errors.push(
      `${file}: ${stray} test(s) sit outside a rule() block — an untraced behaviour test`,
    );
  }
}

for (const file of unitFiles) {
  const claimed = claimedRules(readFileSync(file, 'utf8'));
  if (claimed.length > 0) {
    warnings.push(`${file}: unit test claims a rule — it probably belongs in tests/behaviour/`);
  }
}

// rule -> test
for (const [id, rule] of rulesById) {
  const covered = claims.has(id);
  if (rule.planned && covered) {
    errors.push(
      `${rule.path}:${rule.line}: rule "${id}" is tagged @planned but a test covers it — drop the tag`,
    );
  }
  if (!rule.planned && !covered) {
    errors.push(
      `${rule.path}:${rule.line}: rule "${id}" has no test — write one, or tag it @planned if it is not built yet`,
    );
  }
}

// feature -> test
for (const feature of features) {
  if (feature.rules.length === 0) continue;
  const live = feature.rules.filter((r) => !r.planned);
  if (live.length > 0 && !live.some((r) => claims.has(r.id))) {
    errors.push(`${feature.path}: no test file references any rule in this feature`);
  }
}

// ---- report ----------------------------------------------------------------

const all = [...rulesById.values()];
const planned = all.filter((r) => r.planned);
const live = all.filter((r) => !r.planned);
const traced = live.filter((r) => claims.has(r.id));

console.log('Traceability');
console.log('─'.repeat(64));
for (const feature of features) {
  console.log(`\n  ${feature.path}  [${feature.id ?? '?'}]`);
  for (const rule of feature.rules) {
    const covering = claims.get(rule.id) ?? [];
    const mark = rule.planned ? '·' : covering.length ? '✓' : '✗';
    const note = rule.planned
      ? 'planned'
      : covering.length
        ? covering.join(', ')
        : 'NO TEST';
    console.log(`    ${mark} ${rule.id ?? '(no id)'} — ${note}`);
  }
}
console.log(`\n${'─'.repeat(64)}`);
console.log(
  `  ${traced.length}/${live.length} live rules traced · ` +
    `${planned.length} planned · ${behaviourFiles.length} behaviour files · ${unitFiles.length} unit files`,
);

for (const warning of warnings) console.log(`  warning: ${warning}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} traceability problem(s):\n`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log('\n  traceability OK');
