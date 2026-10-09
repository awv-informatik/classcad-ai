# ClassCAD

Build, verify and export 3D CAD models with Claude. This plugin adds the ClassCAD MCP server and a skill that shows Claude how to use it: describe a part, or hand over a technical drawing, and Claude writes a ClassCAD program, runs it on a real CAD engine on your machine, checks the result with mass properties and renders, and gives you the model as STEP, STL or OFB. The model is live in a CAD app beside the conversation, where you can work on it too, and Claude can turn it into a web app of your own.

ClassCAD is a headless, parametric CAD engine by [AWV Informatik AG](https://awv-informatik.ch). More at [classcad.ai](https://classcad.ai).

## What you get

- **MCP server** `classcad` (the npm package [`@classcad/mcp`](https://www.npmjs.com/package/@classcad/mcp)): tools to run modeling scripts (`run_script`), render views, sections and technical drawings (`snapshot`), read the model structure (`tree`, `find`, `inspect`), look up the API (`docs`, `list_methods`, `describe_method`), save and open files (`save`, `load`), undo points (`checkpoint`, `restore`), the live CAD app of the session (`view`, `share`, `get_selection`, `set_selection`), your account's plan (`account`), and sign in (`login`).
- **Skill** `classcad`: when to reach for ClassCAD, and the plan, build, verify and deliver loop.

## Getting started

After installing, ask Claude for a part, for example "make a 60 mm flange with four bolt holes". The first time, Claude asks you to sign in with a free classcad.ch account (Google, GitHub or email): a sign-in page opens in your browser, and after one click Claude carries on. This happens once per machine.

## What the plugin runs, downloads and sends

Everything runs on your machine. A session's model leaves it only through the share link (below).

- **The server** is started by `launch.mjs` in this plugin. On first use it installs the pinned `@classcad/mcp` once, into `~/.classcad-mcp/runtime/<version>`, then starts it from there with node; no `npx` on every start. The install runs in a process of its own, so it finishes even when the host stops waiting (a slow first download, every file scanned on Windows), and the next start finds it ready. Sessions starting at once wait for one install, under a lock, and an incomplete install is replaced on the next start.
- **The engine**: on first use, the server downloads the ClassCAD WebAssembly engine (about 16 MB) from `awvstatic.com` into `~/.classcad-mcp/wasm/` and runs it locally from then on.
- **Sign-in**: the server opens `https://classcad.ch/connect` in your browser and listens on `127.0.0.1` on a random port for up to 15 minutes, until the page hands your sign-in back. It stores the account's Firebase refresh token in `~/.classcad-mcp/auth.json` (readable only by you) and confirms it with Google's Firebase token service (`securetoken.googleapis.com`) at most once an hour. `login` with `logout: true` removes it.
- **ClassCAD's account service** (`europe-west1-classcad-app.cloudfunctions.net`): with your sign-in the server gets the engine's key there, which your plan decides, and `account` reads your plan, registered domains and public access tokens.
- **Local ports**: a background process of the server listens on `127.0.0.1:9097` (shared by all Claude sessions on the machine) and `127.0.0.1:9098` (another free port if that one is taken), where the app joins its session — and where a ClassCAD web app you open can offer its own session; Claude joins one only when you hand it that app's share link. If a ClassCAD server runs on `localhost:9094`, the MCP uses it instead of its own engine.
- **The app**: with the first model of a session, the CAD app (Buerligons) comes up — in the Claude desktop app's Browser pane, otherwise in your default browser — served by the same background process, with everything it loads in the package. You can work in it: the same model as Claude's.
- **The share link**: a session is also offered on ClassCAD's share relay (Cloudflare), so the app's link works on another device or for a colleague. Whoever has the link is in the session. Opened under it, the app's traffic passes through the relay, which keeps none of it; opened from `127.0.0.1:9098`, nothing of the model leaves your machine. `CLASSCAD_SHARE=ask` makes a session shareable only on request, `off` never.
- **Files**: renders are written as PNG files to your temp folder, or to the folder Claude names. `save` writes a STEP, STL, GLB or OFB file (ClassCAD's own format, with the model's features) to the path Claude names, and `load` reads one from a path you give; the app's File menu saves and opens them through your browser.

Privacy: [awv-informatik.ch/privacy](https://awv-informatik.ch/privacy/). Source: [github.com/awv-informatik/classcad-ai](https://github.com/awv-informatik/classcad-ai).

## Requirements

Node.js 20 or newer with npm, and internet access on first use.

## License

MIT
