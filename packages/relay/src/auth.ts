// auth.ts — who may offer a session here: a machine that is signed in to ClassCAD.
//
// The MCP signs its machine in with a classcad.ch account (auth.ts in
// @classcad/mcp): a Firebase account, so what it can show for it is a Firebase
// ID token — a JWT that Google signed, good for an hour. Checking one needs
// nothing but Google's public keys: no server of ours is asked.
//   alg RS256, signed by one of the keys at JWKS_URL
//   aud  = the Firebase project      iss = https://securetoken.google.com/<project>
//   exp  in the future               sub = the account
//   plan = the account's plan, a claim the ClassCAD backend keeps on every account

/** Google's keys for Firebase ID tokens, as a JWK set. They rotate: the answer says for how long it holds. */
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
/** Clocks differ a little. */
const SKEW_S = 60
/** A token signed with a key that is not known is no reason to ask for the keys again and again. */
const REFETCH_MS = 60_000

export type AuthEnv = {
  /** The Firebase project whose accounts may offer a session. */
  FIREBASE_PROJECT?: string
  /** Where the keys are read from, when not at Google (tests sign their own tokens). */
  FIREBASE_JWKS_URL?: string
}

let keys: { url: string; fetchedAt: number; goodUntil: number; byKid: Map<string, CryptoKey> } | null = null

async function loadKeys(url: string): Promise<Map<string, CryptoKey>> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`the keys are not there (HTTP ${res.status})`)
  const set = (await res.json()) as { keys?: Array<JsonWebKey & { kid?: string }> }
  const byKid = new Map<string, CryptoKey>()
  for (const jwk of set.keys ?? []) {
    if (!jwk.kid || jwk.kty !== 'RSA') continue
    byKid.set(jwk.kid, await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']))
  }
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')?.[1] ?? 3600)
  keys = { url, fetchedAt: Date.now(), goodUntil: Date.now() + maxAge * 1000, byKid }
  return byKid
}

async function keyFor(kid: string, url: string): Promise<CryptoKey | undefined> {
  if (keys && keys.url === url && Date.now() < keys.goodUntil) {
    const known = keys.byKid.get(kid)
    // An unknown key may be a new one — or no key at all.
    if (known || Date.now() - keys.fetchedAt < REFETCH_MS) return known
  }
  return (await loadKeys(url)).get(kid)
}

const decode = (part: string): Uint8Array => {
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)), c => c.charCodeAt(0))
}
const json = (part: string): Record<string, unknown> => JSON.parse(new TextDecoder().decode(decode(part)))

/** The account behind an `Authorization: Bearer <Firebase ID token>` header, or null when it does not hold. */
export async function verify(authorization: string | null, env: AuthEnv): Promise<{ uid: string; plan: string | null } | null> {
  const token = /^Bearer\s+(\S+)$/i.exec(authorization ?? '')?.[1]
  const parts = token?.split('.') ?? []
  if (parts.length !== 3) return null
  try {
    const header = json(parts[0])
    const claims = json(parts[1])
    const project = env.FIREBASE_PROJECT || 'classcad-app'
    const now = Date.now() / 1000
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null
    if (claims.aud !== project || claims.iss !== `https://securetoken.google.com/${project}`) return null
    if (typeof claims.exp !== 'number' || claims.exp < now - SKEW_S) return null
    if (typeof claims.iat === 'number' && claims.iat > now + SKEW_S) return null
    if (typeof claims.sub !== 'string' || !claims.sub) return null
    const key = await keyFor(header.kid, env.FIREBASE_JWKS_URL || JWKS_URL)
    if (!key) return null
    const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    const plan = typeof claims.plan === 'string' ? claims.plan : null
    return (await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(parts[2]), signed)) ? { uid: claims.sub, plan } : null
  } catch {
    return null
  }
}
