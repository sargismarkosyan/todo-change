// A small Gherkin reader, just enough for traceability.
//
// It does not execute anything. It reads specs/features/**/*.feature and
// answers two questions: what rules exist, and are they written well enough to
// be traced. Deliberately dependency-free — see CLAUDE.md.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const FEATURES_DIR = 'specs/features';
export const WORKFLOWS_DIR = 'specs/workflows';
export const PERSONAS_DIR = 'specs/personas';
export const JOURNEYS_DIR = 'specs/journeys';
export const PRODUCT_SPEC = 'specs/spec.md';

/** Soft limits. Exceeding these is a warning, not a failure. */
export const SIZE_LIMITS = { lines: 120, rules: 6 };

const SCENARIO_KEYWORDS = ['Example:', 'Scenario:', 'Scenario Outline:', 'Scenario Template:'];

/** Every .feature file under `dir`, recursively, sorted. */
export function listFeatureFiles(dir = FEATURES_DIR) {
  const found = [];
  const walk = (current) => {
    for (const entry of readdirSync(current).sort()) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.feature')) found.push(full);
    }
  };
  try {
    walk(dir);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return found;
}

/** Every `@prefix:value` in `tags`, in order. A feature may serve two workflows. */
export const tagValues = (tags, prefix) =>
  tags.filter((tag) => tag.startsWith(`@${prefix}:`)).map((tag) => tag.slice(prefix.length + 2));

const tagValue = (tags, prefix) => tagValues(tags, prefix)[0] ?? null;

/**
 * Parse one .feature file.
 * Returns { path, id, name, tags, rules, scenarios, errors, warnings }.
 *
 * `idTag` is the tag that names the document — `@feature:` under
 * specs/features, `@workflow:` under specs/workflows.
 *
 * `requireRules` is what separates the two kinds of Gherkin this repo writes. A
 * feature is a set of Rules and its scenarios are examples of one. A workflow
 * has no Rules: it is one bounded attempt, and its scenarios are walkthroughs of
 * the whole of it, hanging off the Feature: line directly.
 */
export function parseFeature(path, { idTag = 'feature', requireRules = true } = {}) {
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n');
  const errors = [];
  const warnings = [];

  let feature = null;
  const rules = [];
  let pendingTags = [];
  let current = null; // the rule currently being read
  let loose = 0; // scenarios sitting directly under Feature:

  lines.forEach((raw, index) => {
    const line = raw.trim();
    const at = `${path}:${index + 1}`;

    if (line === '' || line.startsWith('#')) return;

    if (line.startsWith('@')) {
      pendingTags.push(...line.split(/\s+/).filter((t) => t.startsWith('@')));
      return;
    }

    if (line.startsWith('Feature:')) {
      if (feature) errors.push(`${at}: a second "Feature:" — one feature per file`);
      feature = {
        name: line.slice('Feature:'.length).trim(),
        tags: pendingTags,
        id: tagValue(pendingTags, idTag),
        line: index + 1,
      };
      if (!feature.name) errors.push(`${at}: "Feature:" has no name`);
      if (!feature.id) errors.push(`${at}: needs an "@${idTag}:<id>" tag above it`);
      pendingTags = [];
      return;
    }

    if (line.startsWith('Rule:')) {
      const rule = {
        name: line.slice('Rule:'.length).trim(),
        tags: pendingTags,
        id: tagValue(pendingTags, 'rule'),
        planned: pendingTags.includes('@planned'),
        scenarios: 0,
        line: index + 1,
        feature: feature?.id ?? null,
        path,
      };
      if (!rule.name) errors.push(`${at}: "Rule:" has no name`);
      if (!rule.id) errors.push(`${at}: rule needs an "@rule:<id>" tag above it`);
      rules.push(rule);
      current = rule;
      pendingTags = [];
      return;
    }

    if (SCENARIO_KEYWORDS.some((kw) => line.startsWith(kw))) {
      if (current) current.scenarios += 1;
      else if (requireRules) errors.push(`${at}: scenario sits outside any "Rule:"`);
      else loose += 1;
      pendingTags = [];
      return;
    }

    pendingTags = [];
  });

  if (!feature) errors.push(`${path}: no "Feature:" line`);
  if (feature && requireRules && rules.length === 0) {
    errors.push(`${path}: feature has no "Rule:" — nothing here can be traced to a test`);
  }
  if (feature && !requireRules) {
    if (rules.length > 0) {
      errors.push(`${path}: a workflow has no "Rule:" — its scenarios are walkthroughs of the whole attempt`);
    }
    if (loose === 0) {
      errors.push(`${path}: no example scenario — a workflow nobody can walk is prose, not Gherkin`);
    }
  }
  for (const rule of rules) {
    if (rule.scenarios === 0) {
      errors.push(`${path}:${rule.line}: rule "${rule.name}" has no example scenario`);
    }
  }

  if (lines.length > SIZE_LIMITS.lines) {
    warnings.push(`${path}: ${lines.length} lines — consider splitting (soft limit ${SIZE_LIMITS.lines})`);
  }
  if (rules.length > SIZE_LIMITS.rules) {
    warnings.push(`${path}: ${rules.length} rules — consider splitting (soft limit ${SIZE_LIMITS.rules})`);
  }

  return {
    path,
    id: feature?.id ?? null,
    name: feature?.name ?? null,
    tags: feature?.tags ?? [],
    rules,
    scenarios: loose,
    errors,
    warnings,
  };
}

/**
 * Parse every feature file and index the rules.
 * Returns { features, rulesById, errors, warnings }.
 */
export function loadFeatures(dir = FEATURES_DIR) {
  const features = listFeatureFiles(dir).map((path) => parseFeature(path));
  const errors = [];
  const warnings = [];
  const rulesById = new Map();
  const featureIds = new Map();

  for (const feature of features) {
    errors.push(...feature.errors);
    warnings.push(...feature.warnings);

    if (feature.id) {
      const seen = featureIds.get(feature.id);
      if (seen) errors.push(`${feature.path}: feature id "${feature.id}" already used by ${seen}`);
      else featureIds.set(feature.id, feature.path);
    }

    for (const rule of feature.rules) {
      if (!rule.id) continue;
      const seen = rulesById.get(rule.id);
      if (seen) {
        errors.push(`${rule.path}:${rule.line}: rule id "${rule.id}" already used by ${seen.path}:${seen.line}`);
      } else {
        rulesById.set(rule.id, rule);
      }
    }
  }

  return { features, rulesById, errors, warnings };
}

/**
 * Parse every workflow file. A workflow is Gherkin without Rules: one bounded
 * attempt, its scenarios walkthroughs of the whole of it.
 * Returns { workflows, workflowsById, errors, warnings }.
 */
export function loadWorkflows(dir = WORKFLOWS_DIR) {
  const workflows = listFeatureFiles(dir).map((path) =>
    parseFeature(path, { idTag: 'workflow', requireRules: false }),
  );
  const errors = [];
  const warnings = [];
  const workflowsById = new Map();

  for (const workflow of workflows) {
    errors.push(...workflow.errors);
    warnings.push(...workflow.warnings);
    workflow.personas = tagValues(workflow.tags, 'persona');
    workflow.journeys = tagValues(workflow.tags, 'journey');
    workflow.planned = workflow.tags.includes('@planned');
    if (!workflow.id) continue;
    const seen = workflowsById.get(workflow.id);
    if (seen) errors.push(`${workflow.path}: workflow id "${workflow.id}" already used by ${seen.path}`);
    else workflowsById.set(workflow.id, workflow);
  }

  return { workflows, workflowsById, errors, warnings };
}

/** Every .md under `dir` that is not the index, sorted. */
function listDocs(dir) {
  try {
    return readdirSync(dir)
      .sort()
      .filter((entry) => entry.endsWith('.md') && entry !== 'README.md')
      .map((entry) => join(dir, entry));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

/**
 * A persona or a journey: prose, with one line of tags at the top.
 *
 * Neither is Gherkin. A persona is not testable and a journey deliberately is
 * not — what a journey carries is the seams between workflows, which is the one
 * thing no scenario can hold. They are still tagged, because a two-way gate
 * needs a file to count.
 *
 * Returns { docs, docsById, errors }.
 */
export function loadTagged(dir, prefix) {
  const docs = [];
  const errors = [];
  const docsById = new Map();

  for (const path of listDocs(dir)) {
    const first = readFileSync(path, 'utf8').split('\n')[0].trim();
    const tags = first.split(/\s+/).filter((t) => t.startsWith('@'));
    const id = tagValues(tags, prefix)[0] ?? null;
    if (!id) {
      errors.push(`${path}: first line needs an "@${prefix}:<id>" tag`);
      continue;
    }
    const doc = { path, id, tags, retired: tags.includes('@retired') };
    if (docsById.has(doc.id)) errors.push(`${path}: ${prefix} id "${doc.id}" already used by ${docsById.get(doc.id).path}`);
    else docsById.set(doc.id, doc);
    docs.push(doc);
  }

  return { docs, docsById, errors };
}

/** `@workflow:<id>` named anywhere in a journey's prose. */
export const workflowsNamedIn = (path) => [
  ...new Set([...readFileSync(path, 'utf8').matchAll(/@workflow:([\w-]+)/g)].map((m) => m[1])),
];

/**
 * The guarantee ids, read from specs/spec.md's "What it must always be".
 *
 * They live there rather than in files of their own because a guarantee has no
 * trigger and no attempt: there is no scenario to write, and the assertions
 * already exist as ordinary features.
 *
 * Returns { guarantees, errors }.
 */
export function loadGuarantees(path = PRODUCT_SPEC) {
  const guarantees = [];
  const errors = [];
  const seen = new Set();

  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    return { guarantees, errors: [`${path}: no such file`] };
  }

  text
    .split('\n')
    .forEach((raw, index) => {
      const match = raw.match(/^-\s+`@guarantee:([\w-]+)`(.*)$/);
      if (!match) return;
      const [, id, rest] = match;
      if (seen.has(id)) {
        errors.push(`${path}:${index + 1}: guarantee id "${id}" is declared twice`);
        return;
      }
      seen.add(id);
      guarantees.push({ id, planned: rest.includes('`@planned`'), path, line: index + 1 });
    });

  if (guarantees.length === 0) errors.push(`${path}: no "@guarantee:<id>" bullets found`);
  return { guarantees, errors };
}

/** Path as written in specs, for messages. */
export const shortPath = (path) => relative(process.cwd(), path) || path;
