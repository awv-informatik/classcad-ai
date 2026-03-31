# cc — ClassCAD API Trainer

An AI agent that trains itself on the ClassCAD CAD engine API through structured exploration sessions against a live server. The deliverable is a battle-tested LLM skill package (`knowledge/classcad-skill/`) that any agent can use to generate correct ClassCAD code.

## OpenClaw

cc is an agent running inside [OpenClaw](https://github.com/openclaw), a local-first AI agent orchestration platform. OpenClaw manages agent lifecycles, scheduling, channels (Telegram, Slack), plugins (Bambu printer, Reolink cameras, Slack monitor), memory, and multi-model routing.

cc's training sessions are triggered by cron jobs inside OpenClaw. Each job spawns an isolated session, picks the next unchecked task from `PLAN.md`, runs the full training pipeline, and commits the results — no human intervention required. ph reviews the output and provides feedback between runs.

## Architecture

```
                  (human trainer)          (OpenClaw cron)
                       │                          │
                       │ reviews, gives feedback, │ triggers sessions
                       │ triggers sessions.       │ (every N minutes)
                       ▼                          ▼
                    ┌────────────────────────────────┐
                    │     cc (agent)                 │
                    │     Claude Opus 4.6            │
                    │     thinking: high             │
                    │     runs inside OpenClaw       │
                    └───────────────┬────────────────┘
                                    │
               ┌────────────────────┼────────────────┐
               │                    │                │
               ▼                    ▼                ▼
      ┌─────────────┐   ┌──────────────┐   ┌──────────────┐
      │  Identity   │   │   Training   │   │    Skill     │
      │  Files      │   │   Pipeline   │   │   Package    │
      │             │   │              │   │              │
      │ IDENTITY.md │   │ HOW-TO-TRAIN │   │ SKILL.md     │
      │ SOUL.md     │   │ PLAN.md      │   │ references/  │
      │ USER.md     │   │ training/    │   │   api/       │
      │ AGENTS.md   │   │              │   │   <domain>/  │
      │ MEMORY.md   │   │              │   │              │
      │ TOOLS.md    │   │              │   │ (submodule)  │
      └─────────────┘   └──────┬───────┘   └──────┬──▲────┘
                               │                  │  │
                               │   ┌──────────┐   │  │
                               └──►│ Harness  │◄──┘ reads api/ + existing LLM docs
                                   │ run.mjs  ├─────►┘ writes new/updated LLM docs
                                   └────┬─────┘
                                        │ WebSocket
                                        ▼
                                 ┌───────────────┐
                                 │  ClassCAD-cli │
                                 │  Server       │
                                 │  :9094        │
                                 └───────────────┘
```

## Repository Layout

```
cc/
├── IDENTITY.md              Agent identity: name, role, vibe, model
├── SOUL.md                  Behavioral rules: source discipline, training rigor
├── USER.md                  Human profile: ph, Berlin, direct, no filler
├── AGENTS.md                Purpose statement and session bootstrap checklist
├── MEMORY.md                Long-term learned state and feedback from ph
├── TOOLS.md                 Harness docs, data capture, skill package layout
├── HEARTBEAT.md             (empty — training is human-driven, not scheduled)
├── TODO.md                  Current task tracking
│
├── scripts/                 Harness code (do not edit)
│   ├── run.mjs              Test runner — connects, runs script, cleans up
│   ├── client.mjs           WebSocket client for ClassCAD
│   ├── render-direct.mjs    Isometric renderer (auto-detects solids/sketches/curves)
│   ├── render.mjs           Alternate renderer
│   ├── copy-api-docs.mjs    Copies upstream API docs into skill references
│   ├── sync-submodule.mjs   Syncs the classcad-skill submodule
│   └── export.mjs           Export utility
│
├── knowledge/
│   ├── classcad-skill/      THE SKILL (git submodule) — the deliverable
│   │   ├── SKILL.md         Skill overview, domain index, conventions
│   │   └── references/
│   │       ├── api/         Source API docs (read-only, 7 domains)
│   │       │   ├── assembly.md
│   │       │   ├── common.md
│   │       │   ├── curve.md
│   │       │   ├── drawing2d.md
│   │       │   ├── expressions.md
│   │       │   ├── part.md
│   │       │   ├── sketch.md
│   │       │   └── solid.md
│   │       └── <domain>/    LLM docs written by cc (verified findings)
│   │       │   └── <api>.md (e.g. create.md, entityInjection.md, ...)
│   │       │   └── ...
│   │       └── ...
│   │
│   └── classcad-cli-skill/  CLI protocol skill (separate)
│
├── workspace/
│   ├── HOW-TO-TRAIN.md      Full training pipeline (the methodology)
│   ├── PLAN.md              254-task learning plan with checkboxes
│   └── training/            Training session archives (31 sessions so far)
│       └── YYYY-MM-DD_HH-MM-SS_<topic>/
│           ├── scripts/     Test scripts (01-basic.mjs, 02-edge.mjs, ...)
│           ├── files/       Harness output (PNGs, STEP, JSON dumps, logs)
│           ├── journal.md   Lab notebook: what was tried, what broke, what surprised
│           └── changes.md   Git diff of skill changes made this session
│
├── memory/                  Daily session notes (raw logs)
└── package.json             Dependencies (@classcad/api-js)
```

## Identity Files

| File          | Purpose                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------ |
| `IDENTITY.md` | Who cc is: name, creature type, vibe, emoji, domain, model                                 |
| `SOUL.md`     | Non-negotiable rules: source discipline, training rigor, never fabricate, read before code |
| `USER.md`     | Who ph is: timezone, preferences, role as trainer, communication style                     |
| `AGENTS.md`   | Session bootstrap: what to read on startup, how training works, workspace layout           |
| `MEMORY.md`   | Accumulated knowledge: skill awareness, feedback corrections, learned patterns             |
| `TOOLS.md`    | Harness documentation: how to run scripts, data capture, reference doc locations           |

These files are read at the start of every session to reconstruct cc's working context.

## The Harness

The test runner (`scripts/run.mjs`) is a thin wrapper that:

1. Connects to ClassCAD via WebSocket (`ws://0.0.0.0:9094/`)
2. Passes `api`, `snapshot()`, and `filewrite()` to the script
3. Runs the script's default export function
4. Captures all console output to `.log` files
5. Clears the drawing and disconnects

```
node scripts/run.mjs <script-path> --outdir <session-folder> [--debug]
```

```
┌─────────────────────────────────────────────────────────┐
│  Script (written by cc)                                 │
│                                                         │
│  export default async function(api, { snapshot, fw }) { │
│    const r = await api.v1.part.create({...})            │
│    console.log(r.result)     // → .log file             │
│    filewrite(r.structure)    // → .json file            │
│    await snapshot('label')   // → .png + .step + .ofb   │
│  }                                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │    run.mjs      │
              │                 │
              │ • connect WS    │
              │ • inject api    │
              │ • capture logs  │
              │ • clear drawing │
              └────────┬────────┘
                       │ WebSocket
              ┌────────▼────────┐
              │   ClassCAD      │
              │   Server        │
              │                 │
              │ Returns:        │
              │ • r.result      │
              │ • r.messages    │
              │ • r.maxLevel    │
              │ • r.structure   │
              │ • r.graphic     │
              └─────────────────┘
```

### Data Capture

| Function                   | Output                                  | Use                       |
| -------------------------- | --------------------------------------- | ------------------------- |
| `console.log(...)`         | `files/<script>.log`                    | Compact one-line findings |
| `snapshot('label')`        | `files/<script>-<label>.png/.step/.ofb` | Visual aids (not proof)   |
| `filewrite(data, 'label')` | `files/<script>-<label>.json/.txt/.bin` | Primary evidence          |

## The Skill Package

`knowledge/classcad-skill/` is the deliverable — a git submodule containing structured API references that help LLMs generate correct ClassCAD code.

```
classcad-skill/
├── SKILL.md                  Overview: 7 domains, 254 APIs, conventions
└── references/
    ├── api/                  SOURCE docs (read-only, from @classcad/api-js)
    │   ├── part.md           Part domain: create, features, work geometry, expressions
    │   ├── solid.md          Solid domain: box, cylinder, boolean, fillet, ...
    │   ├── sketch.md         Sketch domain: constrained 2D geometry
    │   ├── curve.md          Curve domain: lines, arcs, shapes
    │   ├── common.md         Common domain: versioning, object names, save/load
    │   ├── assembly.md       Assembly domain: multi-part structures
    │   ├── drawing2d.md      Drawing domain: 2D views, dimensions
    │   └── expressions.md    Expression domain: parametric math
    ├── <domain>/             LLM docs for domain
    │   └── *.md              (e.g. getAppVersion.md, getClassFileVersion.md, ...)
    │   └── ...
    └── ...
```

**Two kinds of reference files:**

```
references/api/part.md          ← SOURCE (read-only, ground truth)
                                   Full signatures, param tables, return types

references/part/extrusion.md    ← LLM DOC (written by cc, the deliverable)
                                   Gotchas, dead ends, working examples,
                                   verified behavior, practical hints
```

## The Learning Plan

`workspace/PLAN.md` is a 254-task, 9-step learning path ordered by dependency:

```
Step 1: I/O Protocol & API Fundamentals     ✅ complete
   │    (protocol envelope, data types, IDs)
   │
   └─► Step 2: Part Foundations             ◐ in progress
        │   (create, expressions, features, work geometry, entity injection)
        │
        ├─► Step 3: 2D Curves & Shapes      ○ not started
        │
        └─► Step 4: Constrained Sketches    ○ not started
                │
                └─► Step 5: 3D Solids       ○ not started
                     │
                     └─► Step 6: Drawing Management    ○
                          │
                          └─► Step 7: Part Features    ○
                               │
                               └─► Step 8: Assemblies  ○
                                    │
                                    └─► Step 9: Technical Drawings  ○
```

Tasks are strictly ordered. No skipping. Each task is either an **API study** (testing one endpoint) or a **conceptual study** (exploring a cross-cutting concept).

## Training Pipeline

Every training session follows this pipeline:

```
┌──────────────────────────────────────────────────────┐
│                   TRAINING SESSION                   │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐   │
│  │ 1. PICK  ├─►│ 2. READ  ├─►│ 3. CREATE SESSION │   │
│  │ task     │  │ ref docs │  │ folder + journal  │   │
│  │ PLAN.md  │  │ api/*.md │  │                   │   │
│  └──────────┘  │ LLM docs │  └─────────┬─────────┘   │
│                └──────────┘            │             │
│       ┌────────────────────────────────▼─────┐       │
│       │          4. THE LOOP                 │       │
│       │                                      │       │
│       │  ┌──────────┐◄──────────────────┐    │       │
│       │  │  Write   │ one script per    │    │       │
│       │  │  Script  │ method/param/q    │    │       │
│       │  └────┬─────┘                   │    │       │
│       │       │                         │    │       │
│       │  ┌────▼─────┐                   │    │       │
│       │  │   Run    │ run.mjs           │    │       │
│       │  │  Script  │                   │    │       │
│       │  └────┬─────┘                   │    │       │
│       │       │                         │    │       │
│       │  ┌────▼─────┐                   │    │       │
│       │  │ Journal  │ append findings   │    │       │
│       │  │  Entry   │ to journal.md     │    │       │
│       │  └────┬─────┘                   │    │       │
│       │       │                         │    │       │
│       │  ┌────▼─────┐   NO              │    │       │
│       │  │ Coverage ├──────────────────►┘    │       │
│       │  │  met?    │  (next gap, loop)      │       │
│       │  └────┬─────┘                        │       │
│       │       │ YES                          │       │
│       │       ▼                              │       │
│       │    (exit loop)                       │       │
│       │                                      │       │
│       │  Stop at 20 scripts or full coverage │       │
│       └─────────────────┬────────────────────┘       │
│                         │                            │
│  ┌──────────────────────▼─────────────────────────┐  │
│  │  5. WRITE LLM DOC                              │  │
│  │  references/<domain>/<apiName>.md              │  │
│  │  Every LLM doc flag in journal --> addressed   │  │
│  └──────────────────────┬─────────────────────────┘  │
│                         │                            │
│  ┌──────────────────────▼─────────────────────────┐  │
│  │  6. COMMIT + changes.md                        │  │
│  │  git diff --> changes.md --> git commit        │  │
│  └──────────────────────┬─────────────────────────┘  │
│                         │                            │
│  ┌──────────────────────▼─────────────────────────┐  │
│  │  7. MARK COMPLETE                              │  │
│  │  PLAN.md: [ ] --> [done]                       │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Step 4 — Two Tracks

The scripting loop branches based on task type:

```
         Is this an "Api study of ..." task?
                    │
           ┌───YES──┴──NO────┐
           │                 │
     ┌─────▼─────┐    ┌──────▼────┐
     │  Step 4A  │    │  Step 4B  │
     │  API Task │    │ Conceptual│
     │           │    │   Task    │
     │ One script│    │ One script│
     │ per param │    │ per       │
     │ or variant│    │ question  │
     └─────┬─────┘    └─────┬─────┘
           │                │
     Coverage:          Coverage:
     • Every required   • Every question
       param tested       answered
     • Every enum       • Edge cases
       value tried        probed
     • update/delete    • Cross-API
       methods tested     consistency
     • Realistic        • Data-backed
       usage combo        findings
```

### Session Folder Anatomy

Each session produces a self-contained archive:

```
workspace/training/2026-03-31_12-00-00_entityInjection/
│
├── scripts/                          Test scripts
│   ├── 01-basic-create.mjs           One focused test per file
│   ├── 02-custom-name.mjs            Named sequentially
│   ├── 03-multiple-ei.mjs            15-25 scripts typical
│   ├── ...
│   └── 16-realistic-workflow.mjs
│
├── files/                            Harness output (auto-generated)
│   ├── 01-basic-create.log           Console output
│   ├── 01-basic-create-ei-response.json    filewrite dumps
│   ├── 01-basic-create-ei-structure.json   Structure trees
│   ├── 05-ei-with-solid-box-in-ei.png      Snapshots
│   └── ...
│
├── journal.md                        Lab notebook
│   ├── Goal + methods/questions
│   ├── Entry per script (brief or full)
│   ├── 📌 LLM doc: flags for Step 5
│   └── Coverage checklist
│
└── changes.md                        Git diff of skill changes
```

## Key Principles

```
┌───────────────────────────────────────────────────┐
│                 GOLDEN RULES                      │
│                                                   │
│  1. Every task is LIVE                            │
│     Connect to ClassCAD. Run real API calls.      │
│     Nothing is theoretical.                       │
│                                                   │
│  2. Read before you code                          │
│     Study every signature character by character. │
│     Never guess parameter names or ID types.      │
│                                                   │
│  3. Data over screenshots                         │
│     The renderer auto-scales — visual comparison  │
│     alone is unreliable. filewrite() is truth.    │
│                                                   │
│  4. Errors are findings                           │
│     A failure is data. Document it, interpret it. │
│                                                   │
│  5. The skill is the deliverable                  │
│     Journals are working notes. LLM docs are      │
│     what persist. Don't skip Step 5.              │
└───────────────────────────────────────────────────┘
```
