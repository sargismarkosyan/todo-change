#!/usr/bin/env node
// Runs the test suite with coverage, and enforces the threshold.
//
// The threshold only applies once there is application code to measure. Before
// version 1 there is none, and a gate that passes because it measured nothing
// is worse than no gate — so it says out loud that it is inactive.

import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const THRESHOLD = 95;
const SOURCE_DIR = 'src';
// Machine-readable coverage, for tools/report.mjs. The human-readable table
// still goes to stdout; this is the same run, written twice.
const LCOV_FILE = 'coverage/lcov.info';

function listModules(dir) {
  const found = [];
  const walk = (current) => {
    for (const entry of readdirSync(current).sort()) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.m?js$/.test(entry)) found.push(full);
    }
  };
  try {
    walk(dir);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return found;
}

const sources = listModules(SOURCE_DIR);
const args = [
  '--test',
  '--experimental-test-coverage',
  `--test-coverage-include=${SOURCE_DIR}/**`,
];

if (sources.length > 0) {
  args.push(
    `--test-coverage-lines=${THRESHOLD}`,
    `--test-coverage-branches=${THRESHOLD}`,
    `--test-coverage-functions=${THRESHOLD}`,
  );
  console.log(`coverage gate: ${THRESHOLD}% of ${sources.length} module(s) in ${SOURCE_DIR}/\n`);
} else {
  console.log(
    `coverage gate: INACTIVE — no modules in ${SOURCE_DIR}/ yet.\n` +
      `It turns on by itself as soon as the first one lands.\n`,
  );
}

mkdirSync(dirname(LCOV_FILE), { recursive: true });
args.push(
  '--test-reporter=spec',
  '--test-reporter-destination=stdout',
  '--test-reporter=lcov',
  `--test-reporter-destination=${LCOV_FILE}`,
);

args.push('tests/**/*.test.mjs', ...process.argv.slice(2));

const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
