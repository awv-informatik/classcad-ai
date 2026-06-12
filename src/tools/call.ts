// call_api — generic dispatcher for any v1.<domain>.<method>.
//
// Args are passed through to the worker; the server is the source of truth for
// parameter validation. This tool only checks that the method name exists in
// the registry (ships in @classcad/skill, generated there from @classcad/api-js).

import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Client } from '../client.js'
import registry from '@classcad/skill/method-registry.json' with { type: 'json' }

type RegistryEntry = { domain: string; method: string; summary: string; params: { name: string; text: string }[] }
const REGISTRY = registry as Record<string, RegistryEntry>

export function registerCallTool(server: McpServer, client: Client): void {
  server.registerTool(
    'call_api',
    {
      title: 'Call ClassCAD API',
      description:
        'Dispatch any v1.<domain>.<method> call. Workflow: ' +
        'use list_methods to discover names, describe_method for parameter details, ' +
        'and tree/find/inspect to look up live IDs before calling. ' +
        '\n\n' +
        'After completing a meaningful geometry change — a new part, a completed ' +
        'sketch, a boolean, a fillet/chamfer, an extrude — call `snapshot` so the ' +
        'user can see the result. Batch parameter tweaks and intermediate steps ' +
        'into a single snapshot at the end of the coherent edit, not one per call. ' +
        'Skip snapshot entirely for pure reads (getXyz, evaluateExpression, etc.) ' +
        'and setup calls (setDatabaseSettings, recalc).',
      inputSchema: {
        method: z.string().describe('Fully qualified method name, e.g. "v1.part.create" or "v1.sketch.rectangle".'),
        args: z.record(z.string(), z.any()).optional().describe('Argument object. Omit if the method takes no params.'),
      },
    },
    async ({ method, args }) => {
      if (!REGISTRY[method]) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Unknown method "${method}". Use list_methods to see what's available.` }],
        }
      }
      const r = await client.execute({ [method]: [args ?? {}] })
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            method,
            result: r.result,
            maxLevel: r.maxLevel,
            messages: r.messages,
          }),
        }],
      }
    },
  )
}
