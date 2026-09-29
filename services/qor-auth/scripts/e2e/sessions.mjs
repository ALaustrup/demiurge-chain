// End-to-end check: sessions list for real, and revoking one takes effect at once.
//
//   node scripts/e2e/sessions.mjs [base url, default http://127.0.0.1:3100]
//
// Needs qor-auth running against Postgres and Redis, and Node 22+. Exits non-zero if any check fails.
const BASE = process.argv[2] ?? 'http://127.0.0.1:3100';
let passed = 0;
let failed = 0;
function check(name, ok, detail) {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (${detail})`);
}

async function call(method, path, { token, body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

const sidOf = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).sid;
const ids = (r) => (Array.isArray(r.json?.sessions) ? r.json.sessions.map((s) => s.session_id) : []);
const password = 'correct horse battery staple';
const stamp = Date.now() % 1e8;

async function account(name) {
  const username = `${name}${stamp}`;
  const reg = await call('POST', '/api/v1/auth/register', { body: { username, password } });
  if (reg.status !== 201) throw new Error(`register ${username}: ${reg.status}`);
  return async () => {
    const r = await call('POST', '/api/v1/auth/login', { body: { identifier: username, password } });
    if (r.status !== 200) throw new Error(`login ${username}: ${r.status}`);
    return r.json;
  };
}

const loginAlice = await account('sessa');
const loginBob = await account('sessb');
const A1 = await loginAlice();
const A2 = await loginAlice();
const B1 = await loginBob();

// Listing
let r = await call('GET', '/api/v1/profile/sessions');
check('listing without a token refused', r.status === 401, r.status);
r = await call('GET', '/api/v1/profile/sessions', { token: A1.access_token });
check('alice lists her two sessions', r.status === 200 && ids(r).length === 2, `${r.status}, ${ids(r).length} listed`);
check("the list names both of alice's session ids",
  ids(r).includes(sidOf(A1.access_token)) && ids(r).includes(sidOf(A2.access_token)), ids(r).join(','));
const current = (r.json?.sessions ?? []).filter((s) => s.current).map((s) => s.session_id);
check('exactly the calling session is marked current', current.length === 1 && current[0] === sidOf(A1.access_token), current.join(','));
check("bob's session is not in alice's list", !ids(r).includes(sidOf(B1.access_token)), 'checked');
check('no token material in the list', !JSON.stringify(r.json ?? {}).includes(A1.access_token.slice(0, 20)), 'checked');

// Revoking another of one's own sessions
r = await call('DELETE', `/api/v1/profile/sessions/${sidOf(A2.access_token)}`, { token: A1.access_token });
check('alice revokes her second session', r.status === 204, r.status);
r = await call('GET', '/api/v1/profile', { token: A2.access_token });
check("the revoked session's access token is refused at once", r.status === 401, r.status);
r = await call('POST', '/api/v1/auth/refresh', { body: { refresh_token: A2.refresh_token } });
check("the revoked session's refresh token is refused", r.status === 401, r.status);
r = await call('GET', '/api/v1/profile/sessions', { token: A1.access_token });
check('the list no longer shows the revoked session', r.status === 200 && ids(r).length === 1 && !ids(r).includes(sidOf(A2.access_token)), `${r.status}, ${ids(r).length} listed`);
r = await call('DELETE', `/api/v1/profile/sessions/${sidOf(A2.access_token)}`, { token: A1.access_token });
check('revoking it again is 404, not a second success', r.status === 404, r.status);

// Someone else's session, and one that never existed
r = await call('DELETE', `/api/v1/profile/sessions/${sidOf(A1.access_token)}`, { token: B1.access_token });
check("bob cannot revoke alice's session (404)", r.status === 404, r.status);
r = await call('GET', '/api/v1/profile', { token: A1.access_token });
check("alice's session still works after bob's attempt", r.status === 200, r.status);
r = await call('DELETE', `/api/v1/profile/sessions/${crypto.randomUUID()}`, { token: A1.access_token });
check('revoking a session that never existed is 404', r.status === 404, r.status);
r = await call('DELETE', '/api/v1/profile/sessions/not-a-uuid', { token: A1.access_token });
check('a malformed session id is refused', r.status >= 400 && r.status < 500, r.status);

// Stale entries: logout removes a session; the list must not show it
const A3 = await loginAlice();
r = await call('POST', '/api/v1/auth/logout', { token: A3.access_token });
check('a third alice session logs out', r.status === 204, r.status);
r = await call('GET', '/api/v1/profile/sessions', { token: A1.access_token });
check('the logged-out session is not listed', r.status === 200 && ids(r).length === 1, `${r.status}, ${ids(r).length} listed`);

// Revoking one's own current session
r = await call('DELETE', `/api/v1/profile/sessions/${sidOf(A1.access_token)}`, { token: A1.access_token });
check('alice revokes her current session', r.status === 204, r.status);
r = await call('GET', '/api/v1/profile/sessions', { token: A1.access_token });
check('that token is refused at once', r.status === 401, r.status);
r = await call('GET', '/api/v1/profile', { token: B1.access_token });
check('bob is unaffected throughout', r.status === 200, r.status);

console.log(`RESULT: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
