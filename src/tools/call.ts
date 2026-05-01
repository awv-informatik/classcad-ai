// call_api — generic dispatcher for any v1.<domain>.<method>.
//
// Args are passed through to the worker; the server is the source of truth for
// parameter validation. This tool only checks that the method name exists in
// the registry (built from @classcad/api-js .d.ts files).

import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Client } from '../client.js'
import registry from '../method-registry.json' with { type: 'json' }

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
        'PROACTIVE BEHAVIOR — after any mutation (a call that creates, updates, ' +
        'deletes, fillets, booleans, extrudes, or otherwise changes geometry), ' +
        'CALL `snapshot` immediately as the next tool. Do not wait for the user ' +
        'to ask "show me" — they want to see every step. The only times to skip ' +
        'snapshot are pure reads (getXyz, evaluateExpression, getAppVersion, etc.) ' +
        'and lightweight setup calls (setDatabaseSettings, recalc).',
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
          }, null, 2),
        }],
      }
    },
  )
}
