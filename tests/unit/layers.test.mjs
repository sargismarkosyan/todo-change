// Unit tests for the layers above features — workflows, personas, journeys and
// the guarantee ids in specs/spec.md.
//
// No rule() reference here on purpose: this is pipeline machinery, not app
// behaviour, so no Gherkin Rule describes it. Same exemption as
// gherkin.test.mjs — see tools/trace.mjs.

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  loadGuarantees,
  loadTagged,
  loadWorkflows,
  parseFeature,
  tagValues,
  workflowsNamedIn,
} from '../../tools/gherkin.mjs';

let dir;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'layers-'));
});
after(() => {
  rmSync(dir, { recursive: true, force: true });
});

const write = (name, body) => {
  const path = join(dir, name);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, body);
  return path;
};

const WALKABLE = `@workflow:name-a-thing @persona:nell @journey:a-year
Feature: Name a thing

  When a thing arrives, I want it written down.

  Example: it arrives
    When I write it down
    Then it is there
`;

describe('tagValues', () => {
  test('reads every value for a prefix, in order', () => {
    assert.deepEqual(tagValues(['@workflow:a', '@feature:x', '@workflow:b'], 'workflow'), ['a', 'b']);
  });

  test('is empty when the prefix is absent', () => {
    assert.deepEqual(tagValues(['@feature:x'], 'workflow'), []);
  });

  test('does not match a prefix that is only a prefix of another', () => {
    assert.deepEqual(tagValues(['@workflows:a'], 'workflow'), []);
  });
});

describe('parseFeature without rules', () => {
  test('accepts scenarios hanging off the Feature: line', () => {
    const parsed = parseFeature(write('ok.feature', WALKABLE), {
      idTag: 'workflow',
      requireRules: false,
    });
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.id, 'name-a-thing');
    assert.equal(parsed.scenarios, 1);
  });

  test('rejects one with no scenario at all', () => {
    const parsed = parseFeature(
      write('bare.feature', '@workflow:bare\nFeature: Bare\n\n  Just prose.\n'),
      { idTag: 'workflow', requireRules: false },
    );
    assert.match(parsed.errors.join('\n'), /no example scenario/);
  });

  test('rejects a Rule: inside a workflow', () => {
    const parsed = parseFeature(
      write('ruled.feature', `${WALKABLE}\n  @rule:nope\n  Rule: Not here\n    Example: x\n      Then y\n`),
      { idTag: 'workflow', requireRules: false },
    );
    assert.match(parsed.errors.join('\n'), /a workflow has no "Rule:"/);
  });

  test('names the tag it wanted when the id is missing', () => {
    const parsed = parseFeature(write('untagged.feature', 'Feature: Untagged\n  Example: x\n    Then y\n'), {
      idTag: 'workflow',
      requireRules: false,
    });
    assert.match(parsed.errors.join('\n'), /needs an "@workflow:<id>" tag/);
  });

  test('a feature still demands its Rules', () => {
    const parsed = parseFeature(write('feat.feature', '@feature:x\nFeature: X\n'));
    assert.match(parsed.errors.join('\n'), /has no "Rule:"/);
  });
});

describe('loadWorkflows', () => {
  test('reads the personas and journeys off each file', () => {
    const one = mkdtempSync(join(tmpdir(), 'flows-'));
    writeFileSync(join(one, 'a.feature'), WALKABLE);
    const loaded = loadWorkflows(one);
    assert.deepEqual(loaded.errors, []);
    assert.deepEqual(loaded.workflowsById.get('name-a-thing').personas, ['nell']);
    assert.deepEqual(loaded.workflowsById.get('name-a-thing').journeys, ['a-year']);
    assert.equal(loaded.workflowsById.get('name-a-thing').planned, false);
    rmSync(one, { recursive: true, force: true });
  });

  test('rejects a duplicate workflow id', () => {
    const two = mkdtempSync(join(tmpdir(), 'flows-dup-'));
    writeFileSync(join(two, 'a.feature'), WALKABLE);
    writeFileSync(join(two, 'b.feature'), WALKABLE);
    assert.match(loadWorkflows(two).errors.join('\n'), /workflow id "name-a-thing" already used/);
    rmSync(two, { recursive: true, force: true });
  });

  test('returns nothing for a directory that does not exist', () => {
    assert.deepEqual(loadWorkflows(join(dir, 'nope')).workflows, []);
  });
});

describe('loadTagged', () => {
  test('reads the id off the first line and skips the index', () => {
    const one = mkdtempSync(join(tmpdir(), 'tagged-'));
    writeFileSync(join(one, 'nell.md'), '@persona:nell\n\n# Nell\n');
    writeFileSync(join(one, 'rowan.md'), '@persona:rowan @retired\n\n# Rowan\n');
    writeFileSync(join(one, 'README.md'), '# Personas\n');
    const loaded = loadTagged(one, 'persona');
    assert.deepEqual(loaded.errors, []);
    assert.deepEqual(loaded.docs.map((d) => d.id), ['nell', 'rowan']);
    assert.equal(loaded.docsById.get('rowan').retired, true);
    assert.equal(loaded.docsById.get('nell').retired, false);
    rmSync(one, { recursive: true, force: true });
  });

  test('rejects a file with no tag on its first line', () => {
    const one = mkdtempSync(join(tmpdir(), 'tagged-bare-'));
    writeFileSync(join(one, 'stray.md'), '# Stray\n');
    assert.match(loadTagged(one, 'persona').errors.join('\n'), /needs an "@persona:<id>" tag/);
    rmSync(one, { recursive: true, force: true });
  });

  test('rejects a duplicate id', () => {
    const one = mkdtempSync(join(tmpdir(), 'tagged-dup-'));
    writeFileSync(join(one, 'a.md'), '@persona:nell\n');
    writeFileSync(join(one, 'b.md'), '@persona:nell\n');
    assert.match(loadTagged(one, 'persona').errors.join('\n'), /already used/);
    rmSync(one, { recursive: true, force: true });
  });

  test('returns nothing for a directory that does not exist', () => {
    assert.deepEqual(loadTagged(join(dir, 'nope'), 'persona').docs, []);
  });
});

describe('workflowsNamedIn', () => {
  test('finds every workflow a journey names, once each', () => {
    const path = write(
      'journey.md',
      '@journey:a-year\n\nJoins `@workflow:one`, `@workflow:two`, and `@workflow:one` again.\n',
    );
    assert.deepEqual(workflowsNamedIn(path), ['one', 'two']);
  });

  test('finds none in prose that names no workflow', () => {
    assert.deepEqual(workflowsNamedIn(write('quiet.md', '@journey:a-year\n\nNothing here.\n')), []);
  });
});

describe('loadGuarantees', () => {
  test('reads the ids and the planned flag off the bullets', () => {
    const path = write(
      'spec.md',
      [
        '## What it must always be',
        '',
        '- `@guarantee:instant` `@planned` — **Instant.** Nothing waits.',
        '- `@guarantee:survives-return` — **Trustworthy.** It comes back.',
        '',
        'Prose mentioning `@guarantee:survives-return` again, not in a bullet.',
        '',
      ].join('\n'),
    );
    const { guarantees, errors } = loadGuarantees(path);
    assert.deepEqual(errors, []);
    assert.deepEqual(guarantees.map((g) => g.id), ['instant', 'survives-return']);
    assert.equal(guarantees[0].planned, true);
    assert.equal(guarantees[1].planned, false);
  });

  test('rejects the same id declared twice', () => {
    const path = write(
      'twice.md',
      '- `@guarantee:instant` — one\n- `@guarantee:instant` — two\n',
    );
    assert.match(loadGuarantees(path).errors.join('\n'), /declared twice/);
  });

  test('rejects a spec with no guarantee bullets at all', () => {
    assert.match(loadGuarantees(write('none.md', '# Nothing\n')).errors.join('\n'), /no "@guarantee:<id>" bullets/);
  });
});
