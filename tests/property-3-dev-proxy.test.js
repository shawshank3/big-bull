/**
 * Property 3: Dev Proxy Coverage
 *
 * For any URL path string that begins with `/api`, the Vite server proxy
 * configuration in `apps/ui/vite.config.js` SHALL route that request to
 * `http://localhost:4000`, preserving the original path.
 *
 * Since Vite uses prefix matching, the proxy key `/api` covers every path
 * that starts with `/api`. The property is:
 *   - The proxy config key `/api` exists
 *   - Its `target` is `http://localhost:4000`
 *   - Its `changeOrigin` is `true`
 *
 * Validates: Requirements 3.4
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(__dirname, '..');

const VITE_CONFIG_PATH = resolve(WORKSPACE_ROOT, 'apps/ui/vite.config.js');

/**
 * Extract the proxy configuration from vite.config.js by reading it as text.
 *
 * Uses brace-counting to reliably locate the proxy object boundary, then
 * applies a regex to extract each entry's target and changeOrigin fields.
 *
 * Returns an object of shape:
 *   { '/api': { target: string, changeOrigin: boolean }, ... }
 *
 * Returns null if no `proxy:` key is found in the config.
 */
function extractProxyConfig(configSource) {
  const proxyKeyIdx = configSource.indexOf('proxy:');
  if (proxyKeyIdx === -1) {
    return null;
  }

  // Find the opening brace of the proxy value object
  const openBrace = configSource.indexOf('{', proxyKeyIdx);
  if (openBrace === -1) return null;

  // Walk forward counting braces to find the matching closing brace
  let depth = 0;
  let end = -1;
  for (let i = openBrace; i < configSource.length; i++) {
    if (configSource[i] === '{') depth++;
    else if (configSource[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;

  const proxyBlock = configSource.slice(openBrace + 1, end);

  // Parse each entry of the form:  '/api': { target: '...', changeOrigin: true }
  // The inner object body does not contain nested braces in a standard Vite proxy config.
  const entryRegex = /['"]([^'"]+)['"]\s*:\s*\{([^}]+)\}/g;
  const result = {};

  let match;
  while ((match = entryRegex.exec(proxyBlock)) !== null) {
    const key = match[1];
    const body = match[2];

    // Extract target value (single or double quoted string)
    const targetMatch = body.match(/target\s*:\s*['"]([^'"]+)['"]/);
    const target = targetMatch ? targetMatch[1] : undefined;

    // Extract changeOrigin boolean
    const changeOriginMatch = body.match(/changeOrigin\s*:\s*(true|false)/);
    const changeOrigin = changeOriginMatch ? changeOriginMatch[1] === 'true' : undefined;

    result[key] = { target, changeOrigin };
  }

  return result;
}

// Load and parse the vite config once at module level.
const configSource = readFileSync(VITE_CONFIG_PATH, 'utf8');
const proxyConfig = extractProxyConfig(configSource);

test('Property 3 — vite proxy config key /api exists with correct target and changeOrigin', () => {
  assert.ok(
    proxyConfig !== null,
    'Could not locate a proxy: { } block in apps/ui/vite.config.js'
  );

  assert.ok(
    Object.prototype.hasOwnProperty.call(proxyConfig, '/api'),
    'Proxy config in apps/ui/vite.config.js is missing the "/api" key'
  );

  const apiProxy = proxyConfig['/api'];

  assert.strictEqual(
    apiProxy.target,
    'http://localhost:4000',
    `Proxy target for "/api" should be "http://localhost:4000" but got "${apiProxy.target}"`
  );

  assert.strictEqual(
    apiProxy.changeOrigin,
    true,
    `Proxy changeOrigin for "/api" should be true but got ${apiProxy.changeOrigin}`
  );
});

test('Property 3 — for any /api-prefixed path, the proxy key /api covers it (Vite prefix matching)', () => {
  assert.ok(
    proxyConfig !== null,
    'Could not locate a proxy: { } block in apps/ui/vite.config.js'
  );

  /**
   * Generator: produce URL path strings that start with `/api`.
   *
   * Strategy:
   *  - Start with the literal string "/api"
   *  - Optionally append path segments with alphanumeric characters,
   *    hyphens, underscores, and dots — separated by "/"
   *
   * Examples: "/api", "/api/users", "/api/v1/stocks/AAPL", "/api/auth/login"
   */
  const apiPathArb = fc
    .array(
      fc.stringMatching(/^[a-zA-Z0-9_.-]+$/),
      { minLength: 0, maxLength: 5 }
    )
    .map((segments) =>
      segments.length === 0 ? '/api' : '/api/' + segments.join('/')
    );

  fc.assert(
    fc.property(apiPathArb, (path) => {
      // Every generated path must start with /api (generator invariant)
      assert.ok(
        path.startsWith('/api'),
        `Generated path "${path}" does not start with /api — test generator bug`
      );

      // Vite proxy uses prefix matching: the key '/api' covers any path
      // that starts with '/api'. Assert the proxy key exists with correct config.
      assert.ok(
        Object.prototype.hasOwnProperty.call(proxyConfig, '/api'),
        `No proxy key "/api" found — path "${path}" would not be proxied`
      );

      const apiProxy = proxyConfig['/api'];

      assert.strictEqual(
        apiProxy.target,
        'http://localhost:4000',
        `For path "${path}": proxy target should be "http://localhost:4000" but got "${apiProxy.target}"`
      );

      assert.strictEqual(
        apiProxy.changeOrigin,
        true,
        `For path "${path}": proxy changeOrigin should be true but got ${apiProxy.changeOrigin}`
      );
    }),
    { numRuns: 200, verbose: false }
  );
});
