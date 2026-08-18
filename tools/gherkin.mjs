// A small Gherkin reader, just enough for traceability.
//
// It does not execute anything. It reads specs/features/**/*.feature and
// answers two questions: what rules exist, and are they written well enough to
// be traced. Deliberately dependency-free — see CLAUDE.md.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const FEATURES_DIR = 'specs/features';

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

const tagValue = (tags, prefix) => {
  const hit = tags.find((tag) => tag.startsWith(`@${prefix}:`));
  return hit ? hit.slice(prefix.length + 2) : null;
};

/**
 * Parse one .feature file.
 * Returns { path, id, name, rules, errors, warnings }.
 */
export function parseFeature(path) {
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n');
  const errors = [];
  const warnings = [];

  let feature = null;
  const rules = [];
  let pendingTags = [];
  let current = null; // the rule currently being read

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
        id: tagValue(pendingTags, 'feature'),
        line: index + 1,
      };
      if (!feature.name) errors.push(`${at}: "Feature:" has no name`);
      if (!feature.id) errors.push(`${at}: feature needs an "@feature:<id>" tag above it`);
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
      if (!current) errors.push(`${at}: scenario sits outside any "Rule:"`);
      else current.scenarios += 1;
      pendingTags = [];
      return;
    }

    pendingTags = [];
  });

  if (!feature) errors.push(`${path}: no "Feature:" line`);
  if (feature && rules.length === 0) {
    errors.push(`${path}: feature has no "Rule:" — nothing here can be traced to a test`);
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
    errors,
    warnings,
  };
}

/**
 * Parse every feature file and index the rules.
 * Returns { features, rulesById, errors, warnings }.
 */
export function loadFeatures(dir = FEATURES_DIR) {
  const features = listFeatureFiles(dir).map(parseFeature);
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

/** Path as written in specs, for messages. */
export const shortPath = (path) => relative(process.cwd(), path) || path;
