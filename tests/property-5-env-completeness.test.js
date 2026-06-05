/**
 * Property 5: Root .env.example Completeness
 *
 * For any environment variable key declared in either apps/ui/.env.example
 * or apps/api/.env.example, that key SHALL appear in the root .env.example
 * file with a placeholder value AND an inline comment (either a line comment
 * on the line immediately before the KEY= line, or an inline `#` comment on
 * the same KEY= line).
 *
 * Validates: Requirements 1.5
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(__dirname, '..');

const UI_ENV_EXAMPLE_PATH   = resolve(WORKSPACE_ROOT, 'apps/ui/.env.example');
const API_ENV_EXAMPLE_PATH  = resolve(WORKSPACE_ROOT, 'apps/api/.env.example');
const ROOT_ENV_EXAMPLE_PATH = resolve(WORKSPACE_ROOT, '.env.example');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract all KEY names from a .env.example file.
 * Ignores blank lines and lines beginning with `#`.
 */
function parseEnvKeys(filePath) {
  const content = readFileSync(filePath, 'utf8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => line.split('=')[0].trim())
    .filter((key) => key.length > 0);
}

/**
 * Parse the root .env.example into a rich structure.
 * Returns a Map keyed by variable name, each value carrying:
 *   - value:      string  — everything after the first `=` (trimmed, before inline #)
 *   - hasValue:   boolean — true when the value portion is non-empty
 *   - hasComment: boolean — true when either:
 *       (a) the nearest non-blank line above the KEY= line starts with `#`, OR
 *       (b) the KEY= line itself contains an inline `#` comment
 */
function parseRootEnvExample(filePath) {
  const lines = readFileSync(filePath, 'utf8').split('\n');
  const map = new Map();

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Skip blank lines and pure comment lines
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue;

    // Must be a KEY=... line
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    if (!key) continue;

    // Value is everything after the first `=`
    const rest = trimmed.slice(eqIdx + 1);

    // Detect inline comment: a `#` that appears after whitespace after the value
    const inlineCommentIdx = rest.search(/\s#/);
    const hasInlineComment = inlineCommentIdx !== -1;
    const valuePart = hasInlineComment
      ? rest.slice(0, inlineCommentIdx).trim()
      : rest.trim();

    // Check whether the nearest non-blank line above is a comment line
    let prevLineIsComment = false;
    for (let j = i - 1; j >= 0; j--) {
      const prev = lines[j].trim();
      if (prev.length === 0) continue; // skip blank separator lines
      prevLineIsComment = prev.startsWith('#');
      break;
    }

    map.set(key, {
      value: valuePart,
      hasValue: valuePart.length > 0,
      hasComment: hasInlineComment || prevLineIsComment,
    });
  }

  return map;
}

// ── Build input universes ────────────────────────────────────────────────────

const uiKeys  = parseEnvKeys(UI_ENV_EXAMPLE_PATH);
const apiKeys = parseEnvKeys(API_ENV_EXAMPLE_PATH);

// Deduplicated union of both app key sets
const allKeys = [...new Set([...uiKeys, ...apiKeys])];

const rootEnv = parseRootEnvExample(ROOT_ENV_EXAMPLE_PATH);

// ── Tests ────────────────────────────────────────────────────────────────────

test('Property 5 setup — combined ui + api .env.example has at least one key', () => {
  assert.ok(
    allKeys.length > 0,
    'Expected at least one key across apps/ui/.env.example and apps/api/.env.example'
  );
});

test('Property 5 — every key from apps/ui/.env.example and apps/api/.env.example exists in root .env.example with a value and a comment', () => {
  /**
   * fc.constantFrom(...allKeys) samples uniformly from the real set of combined
   * key names. fast-check will attempt to falsify the property for each key.
   *
   * Validates: Requirements 1.5
   */
  const keyArb = fc.constantFrom(...allKeys);

  fc.assert(
    fc.property(keyArb, (key) => {
      // 1. The key must be present in root .env.example
      assert.ok(
        rootEnv.has(key),
        `Key "${key}" from apps ui/api .env.example is missing from root .env.example`
      );

      const entry = rootEnv.get(key);

      // 2. The key must have a non-empty placeholder value
      assert.ok(
        entry.hasValue,
        `Key "${key}" is present in root .env.example but has an empty value`
      );

      // 3. The key must have an associated comment (inline or preceding line)
      assert.ok(
        entry.hasComment,
        `Key "${key}" is present in root .env.example but has no associated comment ` +
        `(add a "# description" on the line above or as an inline comment on the same line)`
      );
    }),
    { numRuns: allKeys.length * 10, verbose: true }
  );
});
