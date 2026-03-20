# TOOLS.md - Training Infrastructure

## Test Harness

The harness (`node scripts/run.mjs`) is a thin test runner. It connects to ClassCAD, runs your script, prints compact results to stdout, then clears and disconnects.

```bash
node scripts/run.mjs <script-path> --outdir <session-folder> [ws-url]
```

- Default WebSocket: `ws://localhost:35007`
- Each `execute()` call prints one line with ✓/❌ markers
- `snapshot('label')` saves PNG + STEP + OFB to `files/`
- Harness clears the drawing after each run — every script starts fresh

**The harness does NOT write your journal.** You write it. See `workspace/HOW-TO-TRAIN.md` for the full methodology.

## Skill Package (your deliverable)

Location: `knowledge/classcad-skill/`

- `SKILL.md` — master skill definition (cross-domain conventions, architecture)
- `references/*.md` — per-domain API documentation with AGENT NOTEs from training

This is a git submodule. To get the diff of your skill changes:

```bash
cd knowledge/classcad-skill && git diff references/ SKILL.md
```

## Reference Docs

| Source            | Location                                  | Purpose                                      |
| ----------------- | ----------------------------------------- | -------------------------------------------- |
| Skill references  | `knowledge/classcad-skill/references/*.md` | Primary — your working docs with AGENT NOTEs |
| Upstream API docs | `knowledge/classcad-api/*.md`                   | Cross-reference when skill refs are unclear  |

## Rendering

The harness uses a direct renderer (`scripts/render-direct.mjs`) that auto-detects content:

- Solids → isometric mesh projection
- Sketches → 2D plot
- Curves → edge data plot

Snapshots are PNG files in `files/`. They show wireframe/outline views — not photorealistic. Interior cavities (e.g., subtraction holes) may not be visible from all angles.
