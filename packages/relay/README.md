# @classcad/relay

The ClassCAD share relay: a Cloudflare Worker where a session that runs on somebody's machine is joined from anywhere.

An MCP session ([`@classcad/mcp`](../mcp)) runs on its user's machine, and the listener its app docks on binds `127.0.0.1`. To let somebody else in — a colleague, or the user's own tablet — the MCP offers the session here, and hands out a second link, to this Worker instead of to `127.0.0.1`:

```
the MCP (anywhere, behind any firewall)                     the relay (Cloudflare)                         a guest (any browser)
  wss://<relay>/session/?host=<invite>          ──────►   one Durable Object per invite   ◄──────   https://<relay>/?invite=<invite>   the app
  wss://<relay>/session/?host=<invite>&guest=…  ──────►   passes the frames of a meeting  ◄──────   wss://<relay>/session/?invite=<invite>
```

- **Nothing is installed and nothing listens** on the user's machine: the MCP dials out, three WebSockets at most per guest. It works behind NAT and firewalls.
- **Our servers are not in it.** The Worker runs on Cloudflare's network; who may offer a session is checked there, against Google's public keys.
- **The relay keeps nothing**: no model, no account, no log of what passed. A Durable Object holds the sockets of one invite and sleeps while nobody speaks (WebSocket hibernation), so an idle shared session costs nothing.
- **The protocol is the MCP listener's.** A page that hosts its own session offers it on `ws://127.0.0.1:9098/session/?host=…` and meets its guests there (`share/server.ts` in the MCP); the relay speaks the same to the MCP. `src/index.ts` has it in full.

## Who gets in

| | |
| --- | --- |
| **Offering a session** (`?host=`) | A machine signed in to ClassCAD: the MCP shows the Firebase ID token of its sign-in (`Authorization: Bearer …`), and the Worker checks signature, project (`FIREBASE_PROJECT`, `classcad-app`), issuer and expiry (`src/auth.ts`). Anything else: 401. The token's `plan` claim decides how many guests the session takes (`GUESTS_BY_PLAN`): none on Free (403), 2 on the trial and Solo, 16 on Pro, Business, contracts and AWV's own plans (Staff, Admin), and one more for the host's own app, which comes in under the share link like a guest. |
| **Joining** (`?invite=`) | Whoever has the link. The invite is a 122-bit random token the MCP mints for sharing — not the one of the user's own app — and it is good until the MCP takes it back (`share` with `stop`) or its session ends. Unknown invite: 403. |
| **A host that comes back** | The same account may offer its invite again on a new connection (a laptop that slept): its guests stay. Another account gets 409. |

Limits, all in `src/index.ts`: guests per session by the host's plan, 17 at most (16 and the host's app), 10 s for the host to meet a guest, 1 MiB of what a guest says before that. Cloudflare's own: one WebSocket frame is at most 32 MiB.

## Run it

```bash
npm run build:app -w @classcad/mcp     # the app guests open (once; needs the vendor/ submodules, see the MCP's README)
npm run dev -w @classcad/relay         # http://127.0.0.1:8787, no Cloudflare account needed
CLASSCAD_RELAY_URL=http://127.0.0.1:8787 …   # in the MCP's env: `share` now hands out links to it
```

## Deploy it

```bash
npx wrangler login                     # once: the Cloudflare account it goes to
npm run deploy -w @classcad/relay      # copies the app into public/ and publishes Worker, assets and Durable Object
```

It is deployed at `https://classcad-share.it-5ca.workers.dev`, which is what the MCP uses (`relayUrl` of the backend in `packages/mcp/src/backend.ts`; `CLASSCAD_RELAY_URL` names another one for a single installation). Deploy it from master, when the MCP is released.

The develop relay, `https://classcad-share-develop.it-5ca.workers.dev`, is the same Worker under another name, for the MCP's develop and staging backends (`CLASSCAD_BACKEND=develop` or `staging`). Deploy it from the develop branch:

```bash
npm run deploy:develop -w @classcad/relay
``` To give it a domain of your own, add one in the Cloudflare dashboard (Workers → classcad-share → Domains) and change that constant.

Deploy again whenever the app changes: guests get the app from here, and it has to fit the MCP that hosts their session.

Durable Objects with the SQLite backend run on the Workers Free plan (100 000 requests a day; 20 incoming WebSocket messages count as one) and on Workers Paid. Since joining needs no account, put a rate-limiting rule in front of `/session` if the address becomes well known.

## Test it

```bash
npm test -w @classcad/relay
```

runs the Worker under `wrangler dev` (Node 22 or later, wrangler's own requirement: on an older Node the tests are skipped) and checks its contract (`test/relay.mjs`): the app's headers, who may offer, the introduction of host and guests, what each hears when the other goes — and, with `@classcad/mcp` built, a session the MCP offers through it end to end.
