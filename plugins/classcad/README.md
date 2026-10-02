# ClassCAD

Build, verify and export 3D CAD models with Claude. This plugin adds the ClassCAD MCP server and a skill that shows Claude how to use it: describe a part, or hand over a technical drawing, and Claude writes a ClassCAD program, runs it on a real CAD engine on your machine, checks the result with mass properties and renders, and gives you the model as STEP or STL, or as a script you can embed in your own ClassCAD app and change live. While Claude builds, the model is open in a CAD app in your browser, where you can turn it, select what you mean and edit it yourself.

ClassCAD is a headless, parametric CAD engine by [AWV Informatik AG](https://awv-informatik.ch). More at [classcad.ai](https://classcad.ai).

## What you get

- **MCP server** `classcad` (the npm package [`@classcad/mcp`](https://www.npmjs.com/package/@classcad/mcp)): tools to run modeling scripts (`run_script`), render views, sections and technical drawings (`snapshot`), read the model structure (`tree`, `find`, `inspect`), look up the API (`docs`, `list_methods`, `describe_method`), export STEP and STL (`save`), undo points (`checkpoint`, `restore`), open the model in a CAD app in your browser that you and Claude work in together (`view`), read what you selected there or select something for you (`get_selection`, `set_selection`), and sign in (`login`).
- **Skill** `classcad`: when to reach for ClassCAD, and the plan, build, verify and deliver loop.

## Getting started

After installing, ask Claude for a part, for example "make a 60 mm flange with four bolt holes". The first time, Claude asks you to sign in with a free classcad.ch account (Google, GitHub or email): a sign-in page opens in your browser, and after one click Claude carries on. This happens once per machine.

## What the plugin runs, downloads and sends

Everything runs on your machine. No model data leaves it.

- **The server** is started by `launch.mjs` in this plugin, which runs `npx -y @classcad/mcp@<pinned version>` (through `npx.cmd` on Windows): that downloads the pinned package and its dependencies from the npm registry.
- **The engine**: on first use, the server downloads the ClassCAD WebAssembly engine (about 16 MB) from `awvstatic.com` into `~/.classcad-mcp/wasm/` and runs it locally from then on.
- **Sign-in**: the server opens `https://classcad.ch/connect` in your browser and listens on `127.0.0.1` on a random port for up to 15 minutes, until the page hands your sign-in back. It stores the account's Firebase refresh token in `~/.classcad-mcp/auth.json` (readable only by you) and confirms it with Google's Firebase token service (`securetoken.googleapis.com`) at most once an hour. `login` with `logout: true` removes it.
- **Local ports**: a background process of the server listens on `127.0.0.1:9097` (shared by all Claude sessions on the machine) and on `127.0.0.1:9098` (see the next point). If a ClassCAD server runs on `localhost:9094`, the MCP uses it instead of its own engine.
- **The app**: with the first model of a session a page opens — in the Browser pane of the Claude desktop app, where Claude opens it, or else in your default browser — served from `127.0.0.1:9098` (another free port if that one is taken) by the same background process: the CAD app Buerligons, connected by WebSocket to that session's engine on the same address. What you do in the app changes the same model Claude works on, and Claude can read what you have selected there. The app and everything it loads come with the package; nothing is fetched from the internet. Each session's link carries a secret invite, the listener answers only requests addressed to it, and a session is joined only while the machine is signed in.
- **Sessions of other apps**: a ClassCAD web app that runs the engine in its own page can offer its session on `127.0.0.1:9098` too; Claude joins one only when you hand it that app's share link.
- **Files**: renders are written as PNG files to your temp folder, or to the folder Claude names. `save` writes a STEP, STL or GLB file to the path Claude names; the app's File menu downloads STEP or STL through your browser.

Privacy: [awv-informatik.ch/privacy](https://awv-informatik.ch/privacy/). Source: [github.com/awv-informatik/classcad-ai](https://github.com/awv-informatik/classcad-ai).

## Requirements

Node.js 20 or newer (for `npx`) and internet access on first use.

## License

MIT
