// ─── MCP Tool Schema definitions ──────────────────────────────────────────────

import type { McpToolSchema } from '../types'

export const TOOL_SCHEMAS: McpToolSchema[] = [
  {
    name: 'call_api',
    description:
      'Call a method on any allowed API namespace — the first segment of the method path selects it:\n' +
      '• v1.<domain>.<method> — ClassCAD command API (documented). args = a single flat object.\n' +
      '• facade.<method> — buerli session/history (e.g. facade.undo, facade.redo, facade.fetchTree). Current drawing auto-targeted; pass only extra args (often none).\n' +
      '• structure / interaction / selection / geometry / … .<method> — buerli drawing APIs (e.g. structure.calculateProductBounds). args = a positional array.\n' +
      'Call list_methods (no args) to see all namespaces; list_methods({ namespace }) for its methods. Use tree/find/inspect for live IDs first. ' +
      'After a meaningful geometry change the 3D view updates automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          description:
            'Namespaced method path, e.g. "v1.part.box", "facade.undo", or "structure.calculateProductBounds".',
        },
        args: {
          type: ['object', 'array'],
          description:
            'Arguments. For v1, a single OBJECT with the fields flat (describe_method lists them as "param.id", "param.length" — ' +
            'pass { "id": 4, "length": 100 }, NOT wrapped in "param"). For facade and the buerli namespaces, a ' +
            'POSITIONAL ARRAY, e.g. [partId]. Omit if the method takes no arguments.',
          // Required so strict-schema models (gpt-5.x) can populate the object form.
          additionalProperties: true,
        },
      },
      required: ['method'],
    },
  },
  {
    name: 'call_api_batch',
    description:
      'Run SEVERAL API calls in one turn, in order — use this for any known multi-step sequence ' +
      '(adding a pipe segment, connecting parts, setting many params) instead of one call_api per ' +
      'turn. It is far faster: one round-trip instead of N. Each entry is { method, args } exactly ' +
      'like call_api. A later call may REFERENCE an earlier result with a "$N" placeholder anywhere ' +
      'in its args: "$0" = whole (unwrapped) result of call 0, "$0.id" = its id field, "$2[0]" = ' +
      'element 0. Id refs are forgiving: "$N" and "$N.id" BOTH reach the id whether the call ' +
      'returned a bare id or { id } — when unsure, just use "$N.id" for ids. It stops at the first ' +
      'error, reporting the failing call\'s args after substitution and how far it got (earlier ' +
      'calls already mutated the drawing). PLAN the whole sequence and compute the numbers up front, ' +
      'then send one batch — do not add one piece, inspect, repeat.',
    inputSchema: {
      type: 'object',
      properties: {
        calls: {
          type: 'array',
          description:
            'Ordered list of { method, args } to run. "method" (required) is a namespaced path like ' +
            '"v1.assembly.instance"; "args" is the same shape call_api takes (a flat object for v1). ' +
            'Put "$N" reference strings anywhere in args to use an earlier result.',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string', description: 'Namespaced method path, e.g. "v1.assembly.fastened".' },
              args: {
                type: ['object', 'array'],
                description: 'Args for the method (may contain "$N" references). Omit if the method takes none.',
                additionalProperties: true,
              },
            },
            additionalProperties: true,
          },
        },
      },
      required: ['calls'],
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
      'Capture a screenshot of the current 3D viewport as a base64 PNG image. ' +
      'Call after a meaningful geometry change (new part, completed feature, boolean, fillet) ' +
      'to evaluate the visual result. Do NOT call after every parameter tweak or intermediate step — ' +
      'batch changes and snapshot once at the end.\n\n' +
      'By default the image matches the viewport aspect ratio with its longest side ' +
      'capped at 1024px; only pass width/height to override.',
    inputSchema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'Short label describing what this snapshot shows. Default: "snapshot".',
        },
        width: {
          type: 'number',
          description: 'Optional. Override width in pixels. If only one of width/height is given, the other is derived from the viewport aspect ratio.',
        },
        height: {
          type: 'number',
          description: 'Optional. Override height in pixels. If only one of width/height is given, the other is derived from the viewport aspect ratio.',
        },
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
