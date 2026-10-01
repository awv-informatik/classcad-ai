// A stand-in for Firebase's token endpoint, so tests sign in without the network.
//   no Referer header, or refresh token "blocked" → 403 like the real, referrer-restricted key
//   refresh token "revoked" → 400 TOKEN_EXPIRED (a dead sign-in)
//   refresh token "other-project" → an id token for another Firebase project
//   anything else → a valid id token for project "buerli", test@example.com
// fakeAuth({ signedIn }) returns the env that points the MCP at it, with its
// own auth file (pre-filled when signedIn, the default).
import { createServer } from 'node:http'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url')

export async function fakeAuth({ signedIn = true } = {}) {
  const server = createServer((req, res) => {
    let body = ''
    req.on('data', c => (body += c))
    req.on('end', () => {
      const token = new URLSearchParams(body).get('refresh_token')
      res.setHeader('content-type', 'application/json')
      if (!req.headers.referer || token === 'blocked') {
        res.statusCode = 403
        return res.end(JSON.stringify({ error: { message: `Requests from referer ${req.headers.referer ?? '<empty>'} are blocked.` } }))
      }
      if (token === 'revoked') {
        res.statusCode = 400
        return res.end(JSON.stringify({ error: { message: 'TOKEN_EXPIRED' } }))
      }
      const aud = token === 'other-project' ? 'someone-else' : 'buerli'
      const idToken = `${b64({ alg: 'RS256' })}.${b64({ aud, user_id: 'uid-test', email: 'test@example.com', name: 'Test' })}.sig`
      res.end(JSON.stringify({ id_token: idToken, refresh_token: token, expires_in: '3600', user_id: 'uid-test' }))
    })
  })
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  server.unref()
  const file = join(mkdtempSync(join(tmpdir(), 'classcad-auth-')), 'auth.json')
  if (signedIn) writeFileSync(file, JSON.stringify({ uid: 'uid-test', email: 'test@example.com', name: 'Test', refreshToken: 'good', project: 'buerli', verifiedAt: Date.now() }))
  return {
    file,
    env: {
      CLASSCAD_AUTH_TOKEN_URL: `http://127.0.0.1:${server.address().port}/token`,
      CLASSCAD_AUTH_FILE: file,
      CLASSCAD_AUTH_URL: 'https://classcad.test/connect',
      CLASSCAD_AUTH_NO_BROWSER: '1',
      // the 3D view never opens a browser in a test
      CLASSCAD_VIEWER_NO_BROWSER: '1',
      CLASSCAD_VIEWER_PORT: '0',
    },
  }
}
