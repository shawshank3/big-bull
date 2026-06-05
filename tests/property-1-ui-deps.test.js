/**
 * Property 1: Dependency Preservation — UI
 *
 * For any dependency entry (name + version) that exists in the original
 * big-bull-ui package.json `dependencies` or `devDependencies`, that exact
 * entry SHALL appear with the same version specifier in apps/ui/package.json.
 *
 * Validates: Requirements 2.3
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(__dirname, '..');

// Paths to the two package.json files under comparison.
// big-bull/ and big-bull-ui/ are siblings inside "BigBull - MERN/".
const ORIGINAL_PKG_PATH = resolve(WORKSPACE_ROOT, '../big-bull-ui/package.json');
const MIGRATED_PKG_PATH = resolve(WORKSPACE_ROOT, 'apps/ui/package.json');

/**
 * Load both package.json files once and build a merged map of every
 * (name -> version) entry from the original's dependencies + devDependencies.
 */
const originalPkg = JSON.parse(readFileSync(ORIGINAL_PKG_PATH, 'utf8'));
const migratedPkg = JSON.parse(readFileSync(MIGRATED_PKG_PATH, 'utf8'));

const originalEntries = {
  ...( originalPkg.dependencies    ?? {} ),
  ...( originalPkg.devDependencies ?? {} ),
};

// Build the universe: array of [name, version] pairs from the original
const universe = Object.entries(originalEntries);

test('Property 1 — every original UI dependency appears with identical version in apps/ui/package.json', () => {
  // Guard: there must be at least one dependency to validate against
  assert.ok(
    universe.length > 0,
    'Expected big-bull-ui/package.json to declare at least one dependency'
  );

  /**
   * fast-check generator: pick any entry from the universe array.
   * fc.integer constrains the index to [0, universe.length - 1] so every
   * element is reachable and no out-of-bounds access can occur.
   */
  const entryArb = fc
    .integer({ min: 0, max: universe.length - 1 })
    .map((i) => universe[i]);

  // Merged lookup of all deps in the migrated package.json
  const migratedEntries = {
    ...( migratedPkg.dependencies    ?? {} ),
    ...( migratedPkg.devDependencies ?? {} ),
  };

  fc.assert(
    fc.property(entryArb, ([name, version]) => {
      assert.ok(
        Object.prototype.hasOwnProperty.call(migratedEntries, name),
        `Dependency "${name}" from original big-bull-ui/package.json is missing in apps/ui/package.json`
      );

      assert.strictEqual(
        migratedEntries[name],
        version,
        `Dependency "${name}" has version "${migratedEntries[name]}" in apps/ui/package.json` +
          ` but expected "${version}" (from original big-bull-ui/package.json)`
      );
    }),
    { numRuns: universe.length * 2, verbose: true }
  );
});
