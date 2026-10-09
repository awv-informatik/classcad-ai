# Recipe — your own app around the model (buerli + React)

For a user who wants an app, a website or a configurator around what was built
in the session. The app runs the same ClassCAD engine in the browser, through
the buerli SDK.

## 1. The account first

Call the MCP tool `account` before writing any app code. It says:

- **where the app may run** — localhost on every plan; a public domain only if it
  is registered on the account (Pro, Business). If the user names a public site
  their plan does not cover, say so now, before building ([PLANS](../references/PLANS.md));
- **the public access token** (`ccpk_…`) that goes into the page — or where the
  user makes one (account page → Access tokens → kind Public);
- whether the plan allows **commercial use** and which **exports**.

## 2. Pick the path

- **A saved model with expressions — the default.** Build the part with
  expressions (`recipes/parametric-part`), `save` it as OFB into the app's
  `public/` folder, load it in the page and drive it with
  `part.updateExpression`. One call per change; the view updates smoothly.
- **The session's script, re-run in the page** — when the shape is JS logic
  (counts, loops, direct modeling). Read parameters as `api.params`
  (`const P = { ...defaults, ...api.params }`) so the same file still runs in the
  MCP; clear the drawing before each run, and coalesce fast slider changes.

## 3. How such an app works

- Vite + React 18 + @react-three/fiber 8, with `@buerli.io/classcad` and
  `@buerli.io/react`, every `@buerli.io/*` package at one and the same exact
  version (1.2.0 or newer).
- The engine runs in the page (WebAssembly from ClassCAD's CDN): no special
  server headers, nothing engine-related goes into the build. It starts with the
  public token — the engine client's `token` option (pages that show a
  `classcadKey` describe an older SDK).
- One engine and one drawing per page: connect once, outside React's render
  (React StrictMode would tear it down). A failed connect says why only in the
  browser console — show the user a message.
- buerli's React geometry component draws the drawing and follows every change
  by itself. ClassCAD is Z-up, in millimetres.
- Scripts from the session expect `{ result, … }` envelopes, as in the MCP;
  buerli's facade API returns results directly. Run a session script against the
  enveloped API, and read the model with the facade's `tree()` / `graphic()` (the
  graphic also holds consumed bodies — [DATA](../references/DATA.md)).
- Where to read: https://buerli.io/docs/ (start, `api/classcad`, `api/react`) ·
  https://classcad.ch/docs/wasm/

## 4. Run it, then check it

Install, start the dev server on localhost and open it in the host's browser
pane: the model shows, a parameter change updates it, `vite build` passes.
A value the model cannot build stays in the model and leaves it without a body —
keep the last good values and put them back.

## 5. Put it online

The build is a static site. It works on localhost and on the https domains
registered on the account — nowhere else. The token in the page is public by
design; secret tokens (`ccsk_…`) never go into a page. An OFB must come from an
engine no newer than the one the page loads.
