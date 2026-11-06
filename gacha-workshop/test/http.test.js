// HTTP checks for CORS and the built-in visual tester. No database needed: a fake pool answers SELECT 1.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');

const pool = { query: async () => ({ rows: [] }) };
async function withServer(options, run) {
  const server = createApp(pool, options).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try { await run('http://127.0.0.1:' + server.address().port); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('CORS is off unless CORS_ORIGINS is set', () => withServer({ corsOrigins: '' }, async base => {
  const res = await fetch(base + '/health', { headers: { Origin: 'https://tester.vercel.app' } });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('access-control-allow-origin'), null);
}));

test('listed origins are echoed; other origins are not', () => withServer({ corsOrigins: 'http://localhost:5500, https://tester.vercel.app/' }, async base => {
  const allowed = await fetch(base + '/health', { headers: { Origin: 'https://tester.vercel.app' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://tester.vercel.app');
  assert.match(allowed.headers.get('vary'), /Origin/);
  const other = await fetch(base + '/health', { headers: { Origin: 'https://evil.example' } });
  assert.equal(other.headers.get('access-control-allow-origin'), null);
}));

test('preflight for JSON POST returns 204 with allowed method and header', () => withServer({ corsOrigins: 'http://localhost:5500' }, async base => {
  const res = await fetch(base + '/api/draw', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5500', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
  assert.equal(res.status, 204);
  assert.match(res.headers.get('access-control-allow-methods'), /POST/);
  assert.match(res.headers.get('access-control-allow-headers'), /Content-Type/i);
}));

test('wildcard allows any origin', () => withServer({ corsOrigins: '*' }, async base => {
  const res = await fetch(base + '/api/catalog', { headers: { Origin: 'null' } });
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
}));

test('/visual redirects relatively so a proxy prefix survives; /visual/ serves the tester', () => withServer({}, async base => {
  const redirect = await fetch(base + '/visual', { redirect: 'manual' });
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get('location'), 'visual/');
  const page = await fetch(base + '/visual/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Gacha visual tester/);
  const script = await fetch(base + '/visual/sketch.js');
  assert.equal(script.status, 200);
}));
