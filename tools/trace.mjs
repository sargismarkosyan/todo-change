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
//
// Since 0018 it closes the same loop one layer up, over the four layers that
// say what the product is and who it is for. Each of these runs in both
// directions on purpose — one direction alone lets a layer fill with strays, or
// go stale with nobody pointing at it:
//
//   feature   -> workflow / guarantee    every feature says what it serves
//   workflow  -> feature                 no workflow nothing implements
//   workflow  -> persona                 no workflow for nobody
//   persona   -> workflow                no persona nobody does anything as
//   guarantee -> feature                 no always-claim nothing asserts
//   workflow  -> test                    no walkthrough nothing walks
//   journey   -> workflow                no dangling reference
//
// See specs/changes/0018-what-it-serves.md.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  JOURNEYS_DIR,
  PERSONAS_DIR,
  loadFeatures,
  loadGuarantees,
  loadTagged,
  loadWorkflows,
  tagValues,
  workflowsNamedIn,
} from './gherkin.mjs';

const TESTS_DIR = 'tests';
const UNIT_DIR = join(TESTS_DIR, 'unit');
const SUPPORT_DIR = join(TESTS_DIR, 'support');
const WORKFLOW_TESTS_DIR = join(TESTS_DIR, 'workflows');

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

/** Workflow ids walked by a test file, via `workflow('some-id', ...)`. */
function claimedWorkflows(source) {
  return [...source.matchAll(/\bworkflow\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
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
  (f) => !f.startsWith(UNIT_DIR) && !f.startsWith(SUPPORT_DIR) && !f.startsWith(WORKFLOW_TESTS_DIR),
);
const unitFiles = testFiles.filter((f) => f.startsWith(UNIT_DIR));
const workflowFiles = testFiles.filter((f) => f.startsWith(WORKFLOW_TESTS_DIR));

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

// ---- the layers above features ---------------------------------------------

const { workflows, workflowsById, errors: flowErrors, warnings: flowWarnings } = loadWorkflows();
const { docs: personas, docsById: personasById, errors: personaErrors } = loadTagged(PERSONAS_DIR, 'persona');
const { docs: journeys, docsById: journeysById, errors: journeyErrors } = loadTagged(JOURNEYS_DIR, 'journey');
const { guarantees, errors: guaranteeErrors } = loadGuarantees();
errors.push(...flowErrors, ...personaErrors, ...journeyErrors, ...guaranteeErrors);
warnings.push(...flowWarnings);

const guaranteesById = new Map(guarantees.map((g) => [g.id, g]));

/** id -> the feature files serving it */
const serving = new Map();
/** id -> the workflow files naming it */
const naming = new Map();
const add = (map, id, path) => map.set(id, [...(map.get(id) ?? []), path]);

// feature -> workflow / guarantee
for (const feature of features) {
  const flows = tagValues(feature.tags, 'workflow');
  const gtees = tagValues(feature.tags, 'guarantee');

  if (flows.length + gtees.length === 0) {
    errors.push(
      `${feature.path}: names no @workflow: or @guarantee: — every feature must say what it serves ` +
        `(the ids are in specs/workflows/ and specs/spec.md)`,
    );
  }
  for (const id of flows) {
    if (!workflowsById.has(id)) {
      errors.push(`${feature.path}: names workflow "${id}", which no file in specs/workflows/ declares`);
      continue;
    }
    add(serving, id, feature.path);
  }
  for (const id of gtees) {
    if (!guaranteesById.has(id)) {
      errors.push(
        `${feature.path}: names guarantee "${id}", which specs/spec.md does not declare ` +
          `under "What it must always be"`,
      );
      continue;
    }
    add(serving, id, feature.path);
  }
}

// workflow -> test
const walked = new Map();
for (const file of workflowFiles) {
  const claimed = claimedWorkflows(readFileSync(file, 'utf8'));
  if (claimed.length === 0) {
    errors.push(
      `${file}: no workflow() block — every test in ${WORKFLOW_TESTS_DIR}/ must name the workflow it walks`,
    );
  }
  for (const id of claimed) {
    if (!workflowsById.has(id)) {
      errors.push(`${file}: walks workflow "${id}", which no file in specs/workflows/ declares`);
      continue;
    }
    add(walked, id, file);
  }
}

// workflow -> feature, persona, journey, test
for (const workflow of workflows) {
  if (!workflow.id) continue;
  const served = serving.has(workflow.id);

  if (workflow.planned && served) {
    errors.push(`${workflow.path}: workflow "${workflow.id}" is tagged @planned but a feature serves it — drop the tag`);
  }
  if (!workflow.planned && !served) {
    errors.push(
      `${workflow.path}: workflow "${workflow.id}" is claimed by no feature — tag a feature ` +
        `@workflow:${workflow.id}, or tag this @planned if nothing implements it yet`,
    );
  }
  if (!workflow.planned && !walked.has(workflow.id)) {
    errors.push(
      `${workflow.path}: workflow "${workflow.id}" is walked by no test — its examples are a costume ` +
        `until something walks them (${WORKFLOW_TESTS_DIR}/, via workflow('${workflow.id}', ...))`,
    );
  }

  const live = workflow.personas.filter((id) => personasById.get(id) && !personasById.get(id).retired);
  for (const id of workflow.personas) {
    const persona = personasById.get(id);
    if (!persona) errors.push(`${workflow.path}: names persona "${id}", which no file in ${PERSONAS_DIR}/ declares`);
    else if (persona.retired) warnings.push(`${workflow.path}: names "${id}", a @retired persona`);
    else add(naming, id, workflow.path);
  }
  if (live.length === 0) {
    errors.push(
      `${workflow.path}: names no live @persona: — a workflow for nobody is a workflow nobody asked for`,
    );
  }

  for (const id of workflow.journeys) {
    if (!journeysById.has(id)) {
      errors.push(`${workflow.path}: names journey "${id}", which no file in ${JOURNEYS_DIR}/ declares`);
    }
  }
  if (workflow.journeys.length === 0) {
    warnings.push(`${workflow.path}: names no @journey: — nothing says where this attempt sits in the arc`);
  }
}

// persona -> workflow
for (const persona of personas) {
  if (persona.retired) continue;
  if (!naming.has(persona.id)) {
    errors.push(
      `${persona.path}: persona "${persona.id}" is named by no workflow — give them one, ` +
        `or tag this file @retired`,
    );
  }
}

// guarantee -> feature
for (const guarantee of guarantees) {
  const served = serving.has(guarantee.id);
  if (guarantee.planned && served) {
    errors.push(
      `${guarantee.path}:${guarantee.line}: guarantee "${guarantee.id}" is tagged @planned but a feature asserts it — drop the tag`,
    );
  }
  if (!guarantee.planned && !served) {
    errors.push(
      `${guarantee.path}:${guarantee.line}: guarantee "${guarantee.id}" is asserted by no feature — ` +
        `tag one @guarantee:${guarantee.id}, or tag this bullet @planned to say so out loud`,
    );
  }
}

// journey -> workflow
for (const journey of journeys) {
  for (const id of workflowsNamedIn(journey.path)) {
    if (!workflowsById.has(id)) {
      errors.push(`${journey.path}: names workflow "${id}", which no file in specs/workflows/ declares`);
    }
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

console.log('\nWhat each feature serves');
console.log('─'.repeat(64));
for (const workflow of workflows) {
  const walkers = walked.get(workflow.id) ?? [];
  const mark = workflow.planned ? '·' : walkers.length ? '✓' : '✗';
  console.log(`\n  ${mark} @workflow:${workflow.id} — ${workflow.personas.join(', ') || 'nobody'}`);
  for (const path of serving.get(workflow.id) ?? []) console.log(`      ${path}`);
}
for (const guarantee of guarantees) {
  const mark = guarantee.planned ? '·' : '✓';
  console.log(`\n  ${mark} @guarantee:${guarantee.id}${guarantee.planned ? ' — planned, nothing asserts it' : ''}`);
  for (const path of serving.get(guarantee.id) ?? []) console.log(`      ${path}`);
}
console.log(`\n${'─'.repeat(64)}`);
console.log(
  `  ${workflows.length} workflows · ${guarantees.filter((g) => !g.planned).length}/${guarantees.length} guarantees asserted · ` +
    `${personas.filter((p) => !p.retired).length} live of ${personas.length} personas · ` +
    `${journeys.length} journey(s) · ${workflowFiles.length} walkthroughs`,
);

for (const warning of warnings) console.log(`  warning: ${warning}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} traceability problem(s):\n`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log('\n  traceability OK');
