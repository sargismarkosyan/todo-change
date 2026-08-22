// Ties a test to the Rule it exists for.
//
//   import { rule } from '../support/covers.mjs';
//
//   rule('add-goes-to-top', () => {
//     test('a new todo appears above the old ones', () => { ... });
//   });
//
// The id must match an "@rule:<id>" tag in specs/features. An unknown id throws
// here, at test time; a Rule with no test is caught by `npm run trace`.

import { describe } from 'node:test';
import { loadFeatures, loadWorkflows } from '../../tools/gherkin.mjs';

const { rulesById, errors } = loadFeatures();

if (errors.length > 0) {
  throw new Error(`specs/features does not parse:\n  ${errors.join('\n  ')}`);
}

const { workflowsById, errors: flowErrors } = loadWorkflows();

if (flowErrors.length > 0) {
  throw new Error(`specs/workflows does not parse:\n  ${flowErrors.join('\n  ')}`);
}

export function rule(id, fn) {
  const found = rulesById.get(id);
  if (!found) {
    const known = [...rulesById.keys()].sort().join(', ') || '(none)';
    throw new Error(
      `unknown rule "${id}". Add an "@rule:${id}" tag in specs/features, ` +
        `or use one of: ${known}`,
    );
  }
  if (found.planned) {
    throw new Error(
      `rule "${id}" is tagged @planned in ${found.path}. ` +
        `Remove the tag in the same change that makes it true.`,
    );
  }
  return describe(`[${id}] ${found.name}`, fn);
}

/** The parsed Rule, for tests that want to read its text. */
export const ruleText = (id) => rulesById.get(id) ?? null;

/**
 * Ties a test to the workflow it walks, one layer up from `rule`.
 *
 *   import { workflow } from '../support/covers.mjs';
 *
 *   workflow('name-a-recipe', () => {
 *     test('a recipe arrives mid-call', async () => { ... });
 *   });
 *
 * A workflow has no Rules, so there is nothing finer to bind to: the test walks
 * the whole attempt, trigger to end state, the way the file's Example: does.
 * Keep them walkthroughs — a single-fact assertion belongs in a behaviour test
 * against the Rule that owns it, and duplicating one here is cost with no cover.
 */
export function workflow(id, fn) {
  const found = workflowsById.get(id);
  if (!found) {
    const known = [...workflowsById.keys()].sort().join(', ') || '(none)';
    throw new Error(
      `unknown workflow "${id}". Add an "@workflow:${id}" tag in specs/workflows, ` +
        `or use one of: ${known}`,
    );
  }
  if (found.planned) {
    throw new Error(
      `workflow "${id}" is tagged @planned in ${found.path}. ` +
        `Remove the tag in the same change that makes it walkable.`,
    );
  }
  return describe(`[${id}] ${found.name}`, fn);
}
