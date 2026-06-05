/**
 * Property 2: Dependency Preservation — API
 *
 * For any dependency entry (name + version) that exists in the original
 * big-bull-api/package.json `dependencies` or `devDependencies`, that exact
 * entry SHALL appear with the same version specifier in apps/api/package.json.
 *
 * Validates: Requirements 2.4
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, '..');

// Paths
// workspaceRoot is .../BigBull - MERN/big-bull
// big-bull-api lives at .../BigBull - MERN/big-bull-api (one level up, sibling directory)
const ORIGINAL_PKG = resolve(workspaceRoot, '../big-bull-api/package.json');
const MIGRATED_PKG = resolve(workspaceRoot, 'apps/api/package.json');

// Load both manifests once
const originalPkg = JSON.parse(readFileSync(ORIGINAL_PKG, 'utf8'));
const migratedPkg = JSON.parse(readFileSync(MIGRATED_PKG, 'utf8'));

// Build the universe: all [name, version] pairs from original package.json
const originalEntries = [
  ...Object.entries(originalPkg.dependencies ?? {}),
  ...Object.entries(originalPkg.devDependencies ?? {}),
];

test('Property 2: every dependency entry from big-bull-api/package.json appears with identical version in apps/api/package.json', () => {
  // Sanity guard: ensure there are entries to check
  assert.ok(
    originalEntries.length > 0,
    'Original big-bull-api/package.json should have at least one dependency entry'
  );

  // Build a flat lookup map from the migrated package (deps + devDeps)
  const migratedDeps = {
    ...(migratedPkg.dependencies ?? {}),
    ...(migratedPkg.devDependencies ?? {}),
  };

  /**
   * fc.constantFrom(...originalEntries) generates one [name, version] pair
   * at a time, drawn uniformly from the original package's full dependency
   * universe. This matches the property statement: "for ANY entry that exists
   * in the original, it SHALL appear with the same version in the migrated
   * file."
   */
  fc.assert(
    fc.property(
      fc.constantFrom(...originalEntries),
      ([name, version]) => {
        assert.ok(
          Object.prototype.hasOwnProperty.call(migratedDeps, name),
          `Dependency "${name}" from big-bull-api/package.json is missing in apps/api/package.json`
        );
        assert.strictEqual(
          migratedDeps[name],
          version,
          `Dependency "${name}" has version "${migratedDeps[name]}" in apps/api/package.json but expected "${version}" from original`
        );
      }
    ),
    { numRuns: originalEntries.length * 10, verbose: true }
  );
});
