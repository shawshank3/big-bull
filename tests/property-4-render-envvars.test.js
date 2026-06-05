/**
 * Property 4: Environment Variable Coverage in render.yaml
 *
 * For any environment variable key declared in apps/api/.env.example
 * (excluding NODE_ENV and PORT which have static values), that key SHALL
 * appear as an entry in the render.yaml envVars list for the big-bull-api
 * service with sync: false.
 *
 * Validates: Requirements 5.4
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(__dirname, '..');

const ENV_EXAMPLE_PATH = resolve(WORKSPACE_ROOT, 'apps/api/.env.example');
const RENDER_YAML_PATH  = resolve(WORKSPACE_ROOT, 'render.yaml');

// ── Parse .env.example ───────────────────────────────────────────────────────
// Extract all KEY=value lines; ignore comments and blank lines.
const EXCLUDED_KEYS = new Set(['NODE_ENV', 'PORT']);

const envExampleContent = readFileSync(ENV_EXAMPLE_PATH, 'utf8');

const secretKeys = envExampleContent
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.startsWith('#'))
  .map((line) => line.split('=')[0].trim())
  .filter((key) => key.length > 0 && !EXCLUDED_KEYS.has(key));

// ── Parse render.yaml (string-based, no external YAML parser needed) ─────────
// Strategy: locate the big-bull-api service block, then extract all
// `- key: <name>` / `  sync: false` pairs within that block.
const renderYamlContent = readFileSync(RENDER_YAML_PATH, 'utf8');

/**
 * Find the character offset where the big-bull-api service block begins.
 * We look for `name: big-bull-api` and then scan forward to collect all
 * envVars entries until either the next top-level service (`- type:`) or EOF.
 */
function parseRenderApiEnvVars(yaml) {
  const lines = yaml.split('\n');

  // Find the line index of `name: big-bull-api`
  const apiServiceLineIdx = lines.findIndex((l) =>
    /^\s*name:\s*big-bull-api\s*$/.test(l)
  );

  if (apiServiceLineIdx === -1) {
    throw new Error('Could not find big-bull-api service in render.yaml');
  }

  // Find the start of the envVars section within this service block
  let envVarsStart = -1;
  for (let i = apiServiceLineIdx; i < lines.length; i++) {
    if (/^\s*envVars:\s*$/.test(lines[i])) {
      envVarsStart = i;
      break;
    }
    // Stop if we hit the next top-level service entry before finding envVars
    if (i > apiServiceLineIdx && /^\s*-\s+type:/.test(lines[i])) {
      break;
    }
  }

  if (envVarsStart === -1) {
    throw new Error('Could not find envVars section in big-bull-api service block');
  }

  // Collect key + sync pairs from the envVars block.
  // Each entry looks like:
  //   - key: SOME_KEY
  //     sync: false        (optional — only for secrets)
  //     value: "..."       (optional — only for static values)
  const envVars = new Map(); // key → { syncFalse: boolean }

  let currentKey = null;
  let i = envVarsStart + 1;

  while (i < lines.length) {
    const line = lines[i];

    // Stop when we exit the envVars indentation (next sibling field or service)
    // envVars items are indented with at least 6 spaces (2 for service, 4 for item)
    if (line.trim().length > 0 && !/^\s{4,}/.test(line)) {
      break;
    }

    const keyMatch = line.match(/^\s*-\s+key:\s*(\S+)/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      envVars.set(currentKey, { syncFalse: false });
    }

    const syncMatch = line.match(/^\s+sync:\s*(false|true)/);
    if (syncMatch && currentKey !== null) {
      if (syncMatch[1] === 'false') {
        envVars.get(currentKey).syncFalse = true;
      }
    }

    i++;
  }

  return envVars;
}

const apiEnvVars = parseRenderApiEnvVars(renderYamlContent);

// ── Tests ────────────────────────────────────────────────────────────────────

test('Property 4 setup — .env.example contains at least one secret key', () => {
  assert.ok(
    secretKeys.length > 0,
    'Expected apps/api/.env.example to declare at least one non-excluded key'
  );
});

test('Property 4 — every apps/api/.env.example secret key appears in render.yaml envVars for big-bull-api with sync: false', () => {
  /**
   * fast-check generator: pick any key from the secretKeys array.
   * fc.constantFrom spreads the array as individual constant arbitraries,
   * meaning fast-check will sample from the real set of secret key names.
   */
  const keyArb = fc.constantFrom(...secretKeys);

  fc.assert(
    fc.property(keyArb, (key) => {
      // 1. The key must be present in render.yaml envVars for big-bull-api
      assert.ok(
        apiEnvVars.has(key),
        `Key "${key}" from apps/api/.env.example is missing from render.yaml envVars for big-bull-api`
      );

      // 2. The entry must have sync: false (not a static value)
      assert.ok(
        apiEnvVars.get(key).syncFalse === true,
        `Key "${key}" is present in render.yaml but does not have sync: false`
      );
    }),
    { numRuns: secretKeys.length * 10, verbose: true }
  );
});
