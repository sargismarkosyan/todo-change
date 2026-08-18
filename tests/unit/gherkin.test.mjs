// Unit tests for the feature reader.
//
// No rule() reference here on purpose: this is pipeline machinery, not app
// behaviour, so no Gherkin Rule describes it. That is exactly what tests/unit
// is for — see the exemption in tools/trace.mjs.

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFeature, loadFeatures, listFeatureFiles } from '../../tools/gherkin.mjs';

let dir;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'gherkin-'));
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

const WELL_FORMED = `@feature:sample
Feature: A sample

  @rule:first-rule
  Rule: The first thing is true
    Example: it is true
      Then it is true
`;

describe('parseFeature', () => {
  test('reads the feature id, name and rules', () => {
    const parsed = parseFeature(write('ok.feature', WELL_FORMED));
    assert.equal(parsed.id, 'sample');
    assert.equal(parsed.name, 'A sample');
    assert.equal(parsed.errors.length, 0);
    assert.equal(parsed.rules.length, 1);
    assert.equal(parsed.rules[0].id, 'first-rule');
    assert.equal(parsed.rules[0].name, 'The first thing is true');
    assert.equal(parsed.rules[0].scenarios, 1);
    assert.equal(parsed.rules[0].planned, false);
  });

  test('marks a rule planned when it carries @planned', () => {
    const parsed = parseFeature(
      write('planned.feature', WELL_FORMED.replace('@rule:first-rule', '@rule:first-rule @planned')),
    );
    assert.equal(parsed.rules[0].planned, true);
    assert.equal(parsed.rules[0].id, 'first-rule');
  });

  test('counts every scenario keyword under a rule', () => {
    const parsed = parseFeature(
      write(
        'many.feature',
        `${WELL_FORMED}    Scenario: another
      Then it is true
    Scenario Outline: a third
      Then it is <what>
`,
      ),
    );
    assert.equal(parsed.rules[0].scenarios, 3);
  });

  test('ignores comments and blank lines', () => {
    const parsed = parseFeature(
      write('comments.feature', `# a note\n\n${WELL_FORMED}\n# trailing\n`),
    );
    assert.equal(parsed.errors.length, 0);
    assert.equal(parsed.rules.length, 1);
  });

  test('a comment between tag and keyword does not eat the tag', () => {
    const parsed = parseFeature(
      write('tagcomment.feature', '@feature:x\n# note\nFeature: X\n\n  @rule:r\n  Rule: R\n    Example: e\n      Then ok\n'),
    );
    assert.equal(parsed.id, 'x');
    assert.equal(parsed.rules[0].id, 'r');
  });

  test('complains when the feature has no id tag', () => {
    const parsed = parseFeature(write('noid.feature', WELL_FORMED.replace('@feature:sample\n', '')));
    assert.match(parsed.errors.join('\n'), /@feature:<id>/);
  });

  test('complains when a rule has no id tag', () => {
    const parsed = parseFeature(write('norule.feature', WELL_FORMED.replace('  @rule:first-rule\n', '')));
    assert.match(parsed.errors.join('\n'), /@rule:<id>/);
  });

  test('complains when a rule has no scenario', () => {
    const parsed = parseFeature(
      write('empty-rule.feature', '@feature:e\nFeature: E\n\n  @rule:r\n  Rule: R\n'),
    );
    assert.match(parsed.errors.join('\n'), /no example scenario/);
  });

  test('complains when a feature has no rules', () => {
    const parsed = parseFeature(write('norules.feature', '@feature:e\nFeature: E\n'));
    assert.match(parsed.errors.join('\n'), /no "Rule:"/);
  });

  test('complains when there is no Feature line', () => {
    const parsed = parseFeature(write('nofeature.feature', '# nothing here\n'));
    assert.match(parsed.errors.join('\n'), /no "Feature:" line/);
  });

  test('complains about a second Feature in one file', () => {
    const parsed = parseFeature(write('two.feature', `${WELL_FORMED}\n@feature:other\nFeature: Other\n`));
    assert.match(parsed.errors.join('\n'), /one feature per file/);
  });

  test('complains about a scenario outside any rule', () => {
    const parsed = parseFeature(
      write('stray.feature', '@feature:s\nFeature: S\n  Example: loose\n    Then ok\n'),
    );
    assert.match(parsed.errors.join('\n'), /outside any "Rule:"/);
  });

  test('complains about an unnamed feature or rule', () => {
    const parsed = parseFeature(
      write('unnamed.feature', '@feature:u\nFeature:\n\n  @rule:r\n  Rule:\n    Example: e\n      Then ok\n'),
    );
    const joined = parsed.errors.join('\n');
    assert.match(joined, /"Feature:" has no name/);
    assert.match(joined, /"Rule:" has no name/);
  });

  test('warns when a file grows past the soft size limit', () => {
    const filler = '\n'.repeat(200);
    const parsed = parseFeature(write('big.feature', WELL_FORMED + filler));
    assert.match(parsed.warnings.join('\n'), /consider splitting/);
  });
});

describe('loadFeatures', () => {
  test('finds .feature files in subfolders', () => {
    write('nested/deep/one.feature', WELL_FORMED);
    const found = listFeatureFiles(dir);
    assert.ok(found.some((f) => f.endsWith(join('nested', 'deep', 'one.feature'))));
  });

  test('returns an empty result for a directory that does not exist', () => {
    const loaded = loadFeatures(join(dir, 'nope'));
    assert.deepEqual(loaded.features, []);
    assert.equal(loaded.errors.length, 0);
  });

  test('rejects a duplicate rule id across files', () => {
    const twin = mkdtempSync(join(tmpdir(), 'gherkin-dup-'));
    writeFileSync(join(twin, 'a.feature'), WELL_FORMED);
    writeFileSync(join(twin, 'b.feature'), WELL_FORMED.replace('@feature:sample', '@feature:sample-two'));
    const loaded = loadFeatures(twin);
    assert.match(loaded.errors.join('\n'), /rule id "first-rule" already used/);
    rmSync(twin, { recursive: true, force: true });
  });

  test('rejects a duplicate feature id across files', () => {
    const twin = mkdtempSync(join(tmpdir(), 'gherkin-dupf-'));
    writeFileSync(join(twin, 'a.feature'), WELL_FORMED);
    writeFileSync(join(twin, 'b.feature'), WELL_FORMED.replace('@rule:first-rule', '@rule:second-rule'));
    const loaded = loadFeatures(twin);
    assert.match(loaded.errors.join('\n'), /feature id "sample" already used/);
    rmSync(twin, { recursive: true, force: true });
  });

  test('indexes rules by id', () => {
    const one = mkdtempSync(join(tmpdir(), 'gherkin-idx-'));
    writeFileSync(join(one, 'a.feature'), WELL_FORMED);
    const loaded = loadFeatures(one);
    assert.equal(loaded.rulesById.get('first-rule').name, 'The first thing is true');
    rmSync(one, { recursive: true, force: true });
  });
});
