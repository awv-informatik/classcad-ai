---
name: classcad
description: Design, build, verify and export 3D CAD models with the ClassCAD MCP. Use when the user wants a mechanical part or assembly (bracket, flange, gear, sprocket, housing, enclosure, shaft, fixture), wants to reproduce a technical drawing, needs a parametric or configurable part, or asks for a STEP or STL file.
---

# ClassCAD

ClassCAD is a headless CAD engine. The ClassCAD MCP runs it on this machine and gives you a live modeling session. You build a model by writing JavaScript programs against its API, you run them with `run_script`, and you prove the result with numbers and renders.

## First use: sign in once

The MCP works with a free classcad.ch account, once per machine. If a tool answers "Sign-in required", the sign-in page has already opened in the user's browser. Show the user the link from that answer as a clickable link on its own line, then call `login`: it waits and returns as soon as they have signed in. Then repeat the call.

## How to build a model

1. **Read the input.** A plain description, a dimensioned drawing, or a photo each need a different approach. A drawing with dimensions is rebuilt with constrained sketches, not hardcoded coordinates.
2. **Plan the whole build**, then fetch every document you need in ONE `docs` call: the matching recipe first, always `recipes/verification`, then the methods (`list_methods` searches them). The server's own instructions name the recipes.
3. **Build in a few substantial scripts.** State persists between scripts: a follow-up script finds the part with `await api.tree()`. Never call `part.create` twice. For a new, unrelated model in the same session, call `clear` first.
4. **Verify with numbers.** `part.calculateMassProperties` after the last operation: compare the volume with what the design math predicts. A render that looks right is not proof.
5. **Show the result.** The session has a live 3D view that opens in the user's browser with the first model and follows every change: give the user its link (results end with it; `view` returns it) on its own line. `snapshot` renders stills (iso, sections, technical drawings in first- or third-angle): pass an `outDir` the user can open and hand them the image.
6. **Deliver.** `save` writes STEP (`format: "STP"`), STL or GLB to a `path` on disk: give the user that path. They can also download the same from the 3D view's Export menu. For a configurable part, give the user the final script: it runs unchanged in their own ClassCAD app, where they can change the parameters live.

## Good to know

- `checkpoint` before a risky step (large booleans, patterns), `restore` if it goes wrong.
- `tree`, `find` and `inspect` show the model structure; `session_info` shows the engine and the sign-in.
- The engine is the same one that runs in ClassCAD apps, so scripts written here carry over.
- More: https://classcad.ai and https://classcad.ch/docs/
