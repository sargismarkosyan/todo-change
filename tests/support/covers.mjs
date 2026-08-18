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
import { loadFeatures } from '../../tools/gherkin.mjs';

const { rulesById, errors } = loadFeatures();

if (errors.length > 0) {
  throw new Error(`specs/features does not parse:\n  ${errors.join('\n  ')}`);
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
