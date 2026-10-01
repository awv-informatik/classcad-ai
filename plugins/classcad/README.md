# ClassCAD

Build, verify and export 3D CAD models with Claude. This plugin adds the ClassCAD MCP server and a skill that shows Claude how to use it: describe a part, or hand over a technical drawing, and Claude writes a ClassCAD program, runs it on a real CAD engine on your machine, checks the result with mass properties and renders, and gives you the model as STEP or STL, or as a script you can embed in your own ClassCAD app and change live.

ClassCAD is a headless, parametric CAD engine by [AWV Informatik AG](https://awv-informatik.ch). More at [classcad.ai](https://classcad.ai).

## What you get

- **MCP server** `classcad` (the npm package [`@classcad/mcp`](https://www.npmjs.com/package/@classcad/mcp)): tools to run modeling scripts (`run_script`), render views, sections and technical drawings (`snapshot`), read the model structure (`tree`, `find`, `inspect`), look up the API (`docs`, `list_methods`, `describe_method`), export STEP and STL (`save`), undo points (`checkpoint`, `restore`), and sign in (`login`).
- **Skill** `classcad`: when to reach for ClassCAD, and the plan, build, verify and deliver loop.

## Getting started

After installing, ask Claude for a part, for example "make a 60 mm flange with four bolt holes". The first time, Claude asks you to sign in with a free classcad.ch account (Google, GitHub or email): a sign-in page opens in your browser, and after one click Claude carries on. This happens once per machine.

## What the plugin runs, downloads and sends

Everything runs on your machine. No model data leaves it.

- **The server** is started by `launch.mjs` in this plugin, which runs `npx -y @classcad/mcp@<pinned version>` (through `npx.cmd` on Windows): that downloads the pinned package and its dependencies from the npm registry.
- **The engine**: on first use, the server downloads the ClassCAD WebAssembly engine (about 16 MB) from `awvstatic.com` into `~/.classcad-mcp/wasm/` and runs it locally from then on.
- **Sign-in**: the server opens `https://classcad.ch/connect` in your browser and listens on `127.0.0.1` on a random port for up to 15 minutes, until the page hands your sign-in back. It stores the account's Firebase refresh token in `~/.classcad-mcp/auth.json` (readable only by you) and confirms it with Google's Firebase token service (`securetoken.googleapis.com`) at most once an hour. `login` with `logout: true` removes it.
- **Local ports**: a background process of the server listens on `127.0.0.1:9097` (shared by all Claude sessions on the machine) and `127.0.0.1:9096`, where a ClassCAD web app you open can offer its session to Claude; it only joins one when you hand Claude that app's share link. If a ClassCAD server runs on `localhost:9094`, the MCP uses it instead of its own engine.
- **Files**: renders are written as PNG files to your temp folder, or to the folder Claude names.

Privacy: [awv-informatik.ch/privacy](https://awv-informatik.ch/privacy/). Source: [github.com/awv-informatik/classcad-ai](https://github.com/awv-informatik/classcad-ai).

## Requirements

Node.js 20 or newer (for `npx`) and internet access on first use.

## License

MIT
