// ─── MCP Tool Schema definitions ──────────────────────────────────────────────

import type { McpToolSchema } from '../types'

export const TOOL_SCHEMAS: McpToolSchema[] = [
  {
    name: 'run_script',
    description:
      'Execute JavaScript against the CAD session — THE tool for any build that involves computation, ' +
      'repetition, or more than a handful of operations. The script runs as an async function body with:\n' +
      '• api.v1.<domain>.<method>(params) — ClassCAD calls, await-able, → { result, maxLevel, messages }. ' +
      'Typos throw immediately with suggestions.\n' +
      '• api.tree({ refresh? }) — the structure tree (id → node): find parts, features, sketches by class/name.\n' +
      '• api.graphic() — the live graphic payload (containers with face meshes, edges, vertices): ' +
      'find and FILTER GEOMETRY yourself — e.g. locate a bore wall by vertex radius, pick a point on a face. ' +
      'NOTE: face mesh/edge ids are payload-local (they rotate on re-tessellation) — to hand a face to another ' +
      'tool, return a world POINT on it, not its id. ' +
      'Exact tree/graphic shapes + selection idioms: read_doc("DATA").\n' +
      '• api.facade / api.structure / api.selection — browser-only extras (guard with `if (api.facade)` for portable scripts).\n' +
      '• Math, full JS (variables, functions, loops), console.log/log(...) captured and returned.\n' +
      '• Use `return <value>` for the data you need back; keep it small (results are size-capped).\n' +
      'Compute coordinates IN the script (trigonometry, loops over teeth/holes/segments) instead of ' +
      'inlining hand-evaluated numbers. Scripts using only api.v1/tree/graphic run unchanged in the ' +
      'ClassCAD MCP and headless harnesses. No DOM/network access; the script must terminate ' +
      '(default timeout 180s on awaited work — the in-browser engine is slow per call, so give scripts room). ' +
      'Prefer FEW SUBSTANTIAL staged scripts over many micro-scripts: batch a whole stage, verify inside the ' +
      'script, return a compact summary — every extra round-trip costs context. State persists in the drawing ' +
      'between scripts.',
    inputSchema: {
      type: 'object',
      properties: {
        script: {
          type: 'string',
          description:
            'JavaScript source. Executed as an async function body — use await directly, return a (small) summary value.',
        },
        label: {
          type: 'string',
          description: 'Short label describing what this script does (shown in the UI).',
        },
        timeoutMs: {
          type: 'number',
          description: 'Optional timeout for awaited work in ms (default 180000, max 300000 — the in-browser engine is slower per call than a native worker; give big scripts room instead of splitting them).',
        },
      },
      required: ['script'],
    },
  },
  {
    name: 'tree',
    description:
      'Return the structure tree of the current drawing. ' +
      'Shows all nodes with id, class, name, and parent. Use this to discover object IDs.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'find',
    description:
      'Search the structure tree by class and/or name substring. ' +
      'Returns slim records (id, class, name, parent).',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Match nodes whose class === type (e.g. "CC_Part", "CC_Box", "CC_WorkPlane").',
        },
        name: {
          type: 'string',
          description: 'Match nodes whose name contains this substring (case-insensitive).',
        },
      },
    },
  },
  {
    name: 'inspect',
    description: 'Return the full record for a single tree node by ID, including members and parent chain.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: ['string', 'number'],
          description: 'Node ID to inspect.',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_selection',
    description:
      "Get the user's current selection in the 3D viewport. " +
      'Returns an array of selected entity info objects.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'set_selection',
    description: 'Programmatically set (highlight) entities in the 3D viewport.',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Array of selection info objects to highlight.',
          items: {
            type: 'object',
            properties: {
              containerId: { type: 'number' },
              graphicId: { type: 'number' },
              prodRefId: { type: 'number' },
            },
          },
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'list_methods',
    description:
      'Discover API methods. With NO arguments, lists the available namespaces. namespace="v1" lists documented ' +
      'ClassCAD methods (filter by domain/name). namespace="facade" or a buerli namespace ' +
      '(structure/interaction/selection/geometry/…) reflects its methods live (names only — call with a positional args array).',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          description: 'Which API to list: v1, facade, structure, interaction, selection, geometry, … (omit to list all namespaces).',
        },
        domain: {
          type: 'string',
          description: '(v1 only) Filter by domain: part, assembly, sketch, common, curve, solid, drawing2d.',
        },
        filter: {
          type: 'string',
          description:
            '(v1 only) Search by intent/keyword. Matches method NAMES and SUMMARIES, ranked by relevance, and expands ' +
            'common CAD synonyms (e.g. "split" also finds slice/cut/section; "hole" finds bore/drill). Prefer describing ' +
            'the operation you want ("split solid", "cut", "fillet") over guessing an exact name.',
        },
      },
    },
  },
  {
    name: 'describe_method',
    description:
      'Get documentation for an API method. v1 methods (e.g. "v1.part.box" or just "box") return rich docs from the ' +
      'classcad-skill knowledge base. Non-v1 paths (e.g. "structure.calculateProductBounds") return curated docs where ' +
      'available, otherwise just the reflected argument count.',
    inputSchema: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          description: 'Method path: "v1.part.box" (or just "box"), or a non-v1 path like "structure.calculateProductBounds".',
        },
      },
      required: ['method'],
    },
  },
  {
    name: 'snapshot',
    description:
      'Render the drawing as a PNG — DETERMINISTIC by default: standard views, whole model in frame, ' +
      'reproducible (independent of what the user has zoomed/rotated to). Verification options: ' +
      'section (cut through internals), sheet (four labeled views in one image), highlight/highlightAt ' +
      '(faces/edges in signal color — use highlightAt with world POINTS across tool calls, face ids are ' +
      'payload-local), markers (probe crosshairs), sketchOverlay (sketch curves on their real plane), ' +
      'annotate (extents + axes triad + scale bar), xray (hidden geometry shines through), colors ' +
      '"distinct" (one color per body), frame (pin an earlier snapshot\'s reported frame for ' +
      'pixel-comparable before/after). recalc:false is MANDATORY for solid.*/entity-injection sessions. ' +
      'Use snapshots when a visual check genuinely helps — not after every step.',
    inputSchema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'Short label describing what this snapshot shows. Default: "render".',
        },
        width: { type: 'number', description: 'Image width in pixels (default 1024).' },
        height: { type: 'number', description: 'Image height in pixels (default 768).' },
        view: {
          type: ['string', 'object'],
          description:
            'Camera: "iso" (default) | "top" | "bottom" | "front" | "back" | "left" | "right", or an ' +
            'arbitrary orthographic camera { azimuth, elevation } (degrees, Z-up; 0/0 = front) / { direction: [x,y,z], up? }.',
          additionalProperties: true,
        },
        zoom: { type: 'number', description: 'Multiplier on the auto-fit scale (>1 zooms in).' },
        lookAt: {
          type: 'array', items: { type: 'number' },
          description: 'World point [x,y,z] that lands at the image center.',
        },
        layers: {
          type: 'array', items: { type: 'string', enum: ['solid', 'sketch', 'curves', 'workgeo'] },
          description: 'Content layers to render. Default ["solid"].',
        },
        colors: {
          type: 'string', enum: ['native', 'distinct'],
          description: '"native" (default): the model\'s own colors. "distinct": one palette color per body — booleans/splits/patterns.',
        },
        section: {
          type: 'object',
          properties: {
            origin: { type: 'array', items: { type: 'number' } },
            normal: { type: 'array', items: { type: 'number' } },
          },
          description: 'Cut the solids at a plane; the positive side of the normal is removed (uncapped, interior shaded).',
        },
        sheet: {
          type: ['boolean', 'array'],
          description: 'true = four-view sheet (top/iso/front/right, shared ortho scale) in ONE image; or an array of 4 views.',
        },
        highlight: {
          type: 'array', items: { type: 'number' },
          description: 'Ids in signal color (container/solid/face-mesh/edge). Face/edge ids are payload-local — across tool calls use highlightAt.',
        },
        highlightAt: {
          type: 'array', items: { type: 'array', items: { type: 'number' } },
          description: 'World points [[x,y,z],…]: the closest FACE in the rendered payload is highlighted per point (geometrically anchored — robust).',
        },
        markers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              position: { type: 'array', items: { type: 'number' } },
              label: { type: 'string' },
              color: { type: 'array', items: { type: 'number' } },
            },
          },
          description: 'Probe markers (crosshair + label) at world coordinates, drawn on top.',
        },
        sketchOverlay: { type: 'boolean', description: 'Draw sketch curves in 3D on their actual plane over the solid render.' },
        annotate: { type: 'boolean', description: 'Measurement overlay: bbox extents, view-oriented axes triad, scale bar.' },
        xray: { type: 'boolean', description: 'Translucent bodies — hidden geometry shines through.' },
        frame: {
          type: 'object',
          properties: { scale: { type: 'number' }, midX: { type: 'number' }, midY: { type: 'number' } },
          description: 'Pin the frame reported by an earlier snapshot (same view/size) for pixel-comparable before/after.',
        },
        recalc: { type: 'boolean', description: 'Default true. MUST be false for solid.*/entity-injection sessions (recalc destroys injected bodies).' },
      },
    },
  },
  {
    name: 'load_file',
    description:
      'Import a user-attached CAD file (STEP, IGES, STL, etc.) into the current drawing. ' +
      'Use the exact file name shown in the "Attached files" note of the user message. ' +
      'After loading, call tree/find to locate the imported geometry, then operate on it.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Exact name of the attached file to import (as listed in the attachment note).',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'download',
    description:
      'Export the current model to a file and offer it to the user as a DOWNLOAD BUTTON in the chat. ' +
      'Use this whenever the user wants to save, export, or download the model — the app runs in a ' +
      'browser sandbox and cannot write to disk on its own, so the user must click the button to save. ' +
      'Do NOT use v1.common.save for this: its data string is returned to you, not to the user, and ' +
      'cannot reach their disk. This tool keeps the bytes app-side and renders a one-click download. ' +
      'Formats: STEP (CAD interchange, keeps assembly), STL (mesh / 3D printing), OFB (native buerli, reloadable).',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['STEP', 'STL', 'OFB'],
          description: 'Export format. STEP = CAD interchange (default), STL = mesh, OFB = native buerli save.',
        },
        filename: {
          type: 'string',
          description: 'Optional base file name (the correct extension is added automatically). Default: "model".',
        },
      },
    },
  },
  {
    name: 'read_doc',
    description:
      'Read a whole knowledge document: topic docs ("SKETCHING" — read this BEFORE your first sketch work, ' +
      '"STRUCTURE", "GRAPHICS"), per-domain API overviews ("api/part", "api/sketch", …) and worked ' +
      'end-to-end RECIPES ("recipes/parametric-part", "recipes/pattern-then-subtract", ' +
      '"recipes/direct-modeling-eif", "recipes/verify-numerically"). Recipes show the composed workflow ' +
      'with its pitfalls — read the matching recipe before starting a multi-feature build. ' +
      'Call with no args to list every available document. (Per-method docs: describe_method.)',
    inputSchema: {
      type: 'object',
      properties: {
        doc: {
          type: 'string',
          description: 'Document key, e.g. "SKETCHING", "api/part", "recipes/parametric-part". Omit to list all.',
        },
      },
    },
  },
  {
    name: 'checkpoint',
    description:
      'Save the ENTIRE current drawing state app-side (in-memory) so it can be restored later. ' +
      'Take a checkpoint BEFORE any risky multi-step sequence (booleans over many bodies, big ' +
      'regenerations, experimental approaches) — then a failed attempt costs one restore instead of ' +
      'undo/delete archaeology. Cheap; keeps the last 5 per drawing (page-lifetime only).',
    inputSchema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'Name for this checkpoint (e.g. "before-teeth-cut"). Reusing a label overwrites it.',
        },
      },
    },
  },
  {
    name: 'restore',
    description:
      'Replace the current drawing with a previously saved checkpoint — the clean way to start a ' +
      'failed sequence over. All ids created after the checkpoint become stale: re-read them ' +
      '(tree/find) before further operations. Without a label, restores the most recent checkpoint.',
    inputSchema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'Checkpoint name to restore. Omit for the most recent one.',
        },
      },
    },
  },
  {
    name: 'notes',
    description:
      'Your persistent scratchpad for this drawing — survives even when old tool results are pruned ' +
      'from the conversation. On long tasks, keep a CURRENT plan here: steps done, key ids ' +
      '(part/feature/sketch ids you will need again), next action. Rewrite with "set" when it gets ' +
      'stale — this is working state, not a log. Read it back with "get" whenever you lost track.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get', 'set', 'append'],
          description: '"get" returns the notes, "set" replaces them, "append" adds a line.',
        },
        text: {
          type: 'string',
          description: 'The notes content (for set/append).',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'delegate',
    description:
      'Delegate a focused sub-task to a specialist sub-agent. The sub-agent has access to all ' +
      'the same tools but operates with a scoped persona and goal. Use this for complex tasks ' +
      'that benefit from separation of concerns (e.g. delegate sketching to the sketch specialist ' +
      'while you focus on the overall part structure).\n\n' +
      'Available agents: sketch, boolean, fillet_chamfer, assembly, analysis.\n' +
      'You can also use any custom name — it will run with a generic specialist prompt.',
    inputSchema: {
      type: 'object',
      properties: {
        agent: {
          type: 'string',
          description: 'Name of the specialist to delegate to: sketch, boolean, fillet_chamfer, assembly, analysis, or a custom name.',
        },
        goal: {
          type: 'string',
          description: 'Clear, specific goal for the sub-agent. Include all necessary context (IDs, dimensions, constraints).',
        },
      },
      required: ['agent', 'goal'],
    },
  },
]
