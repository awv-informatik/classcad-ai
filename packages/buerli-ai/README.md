# @buerli.io/ai

AI assistant for [buerli](https://buerli.io)/ClassCAD applications. Adds a chat panel to
your app that creates and modifies 3D geometry through natural language — connect any
tool-calling LLM; all CAD operations execute locally in the browser. See it in action in
[buerligons](https://buerligons.io), our open CAD modeler.

![intro](/intro.jpg)

## Install

```bash
npm install @buerli.io/ai
```

Peer dependencies: `@buerli.io/classcad`, `@buerli.io/core`, `@react-three/fiber` ≥8,
`react` ≥18, `zustand` ≥4.

## Connect a model

The agent talks to any LLM through a small `LLMProvider` interface. Built-in providers:

| Provider                                    | Use for                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| `createAnthropicProvider({ apiKey })`       | Claude — the Anthropic API or any compatible proxy                                |
| `createAutoProvider({ apiKey, endpoint })`  | OpenAI, Azure, or any OpenAI-compatible endpoint serving multiple models          |
| `createOpenAIProvider({ endpoint, model })` | A single Chat Completions endpoint — including local AI (Ollama, LM Studio, vLLM) |
| your own `LLMProvider`                      | anything else — one `chat()` method (see Custom integration)                      |

`createAutoProvider` is the most capable choice for OpenAI-style endpoints: it reads the
endpoint's `/models` to discover what's available, routes each model to the right API
surface (Responses vs Chat Completions), and learns per-model context windows and
thinking levels — which powers the panel's built-in model and thinking pickers.
(`createResponsesProvider` is also exported if you want to pin the Responses surface.)

```ts
createAnthropicProvider({ apiKey: ANTHROPIC_KEY })
createAutoProvider({ apiKey: OPENAI_KEY, endpoint: 'https://api.openai.com/v1', model: 'gpt-5.5' })
createOpenAIProvider({ apiKey: 'ollama', endpoint: 'http://localhost:11434/v1/chat/completions', model: 'qwen3' })
```

> Tool-use quality varies between models. Strong tool-calling models (GPT-5.x, Claude,
> Gemini) work best; small local models may not reliably follow the tool protocol.

## Usage (React / react-three-fiber)

```tsx
import { createCadAgent, createAutoProvider, initAgentAsync } from '@buerli.io/ai'
import { useBuerli, BuerliGeometry } from '@buerli.io/react'
import { Canvas } from '@react-three/fiber'

await initAgentAsync() // once at startup — loads the bundled ClassCAD knowledge

const { AgentPanel } = createCadAgent({
  provider: createAutoProvider({ apiKey: API_KEY, endpoint: API_ENDPOINT }),
  // modelName, reasoningEffort        — default model + thinking level
  // maxTokens, contextLimit           — fallbacks; per-model values are auto-discovered
  // maxIterations: 40                 — tool-loop cap
  // systemPrompt / extraContext       — see Custom prompts
})

function App() {
  const drawingId = useBuerli((s) => s.drawing.active || '')
  const [open, setOpen] = useState(true)
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas>
        <BuerliGeometry drawingId={drawingId} />
      </Canvas>
      <AgentPanel drawingId={drawingId} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
```

`<AgentPanel>` props: `drawingId` (required), `open`, `onClose`,
`position` (`'right' | 'left' | 'bottom'`), `className`, `theme`
(`{ bg, text, accent, userBubble, assistantBubble, width }`), and `extraContext`
(per-mount domain prompt — overrides the factory default when one agent serves
several screens).

What the panel gives you out of the box:

- **Model picker, thinking picker, and context ring** — capability-driven; each control
  appears only when the provider/model actually supports it.
- **Attachments** — images (vision) and CAD files (STEP/IGES/STL…) via the `+` button.
- **Stop** to abort a running turn; **per-tool status chips** with results and errors.
- **Source panel** (`</>` in the header) — the session as a runnable, syntax-highlighted
  buerli script: runtime IDs threaded into variables, one-click copy.

## Custom prompts

The default system prompt makes the agent a general ClassCAD expert. Add your domain on
top with `extraContext` (recommended — keeps the base expertise), or replace the whole
prompt with `systemPrompt`:

```tsx
createCadAgent({
  provider,
  extraContext: `## This app: parametric pipe runs
Segments are named Default, Pipe1, …; expressions: length, outerDiam, thickness.
Angles in radians (UI shows degrees). Always recalc after edits.`,
})
```

Teach it your model's structure, naming, units, and the exact calls for common
operations — the more concrete, the fewer discovery turns the agent needs. When
replacing `systemPrompt`, you can compose with the exported `DEFAULT_SYSTEM_PROMPT`.

## What the agent can do (tools)

| Tool                               | Purpose                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| `run_script`                       | Execute model-written JavaScript against the API — math, loops, `await api.v1.*`; the primary medium for real builds |
| `call_api`                         | Any single `v1.<domain>.<method>` ClassCAD call (also `facade.*` and drawing APIs) |
| `tree` / `find` / `inspect`        | Read the structure tree, search nodes, full node detail                         |
| `get_selection` / `set_selection`  | Read or set the user's 3D selection                                             |
| `list_methods` / `describe_method` | Discover and document the 254 API methods                                       |
| `read_doc`                         | Whole knowledge documents: topic guides (`SKETCHING`, …), API overviews, worked recipes |
| `snapshot`                         | Deterministic render of the drawing (@classcad/renderer): standard views, section, sheet, highlightAt, markers, annotate, x-ray, frame pinning — sent to the model as vision when the selected model supports it |
| `checkpoint` / `restore`           | In-memory save/rollback of the whole drawing — failed attempts become cheap     |
| `notes`                            | Persistent per-drawing scratchpad (plan, key ids) that survives context pruning |
| `load_file`                        | Import a user-attached CAD file                                                 |
| `download`                         | Export STEP/STL/OFB as a download button in the chat                            |
| `delegate`                         | Hand a sub-task to a specialist sub-agent (runs with the full base prompt)      |

Everything executes in the browser against the buerli API — no extra server for CAD.
The ClassCAD knowledge (method registry + curated docs + recipes) ships via the
`@classcad/skill` dependency and loads with `initAgentAsync()`. (`TOOL_SCHEMAS` and
`executeTool` are exported for tests or custom executors.)

Long sessions stay healthy on their own: oversized tool results are size-capped, and
when the history approaches the model's context window, old tool results are pruned —
recent turns, all conversation text, and the agent's `notes` survive.

## Production

Never ship API keys in the browser. Point the provider at your backend and authenticate
your users there:

```ts
// client
createAutoProvider({ apiKey: userSessionToken, endpoint: 'https://your-app.com/api/ai' })
// server: verify the user, attach the real provider key, forward the body verbatim.
```

## Custom integration (your own UI)

`<AgentPanel>` is a thin view over `createAgentStore()` — build your own chat UI on the
same store and keep the full agent (tools, scripting, attachments, cancel):

```tsx
import { createAgentStore, createAutoProvider, initAgentAsync } from '@buerli.io/ai'
import type { AgentConfig, UIMessage } from '@buerli.io/ai'

await initAgentAsync()
const useAgent = createAgentStore() // zustand — React hook AND vanilla store

const config: AgentConfig = {
  provider: createAutoProvider({ apiKey: '…', endpoint: '…' }),
  drawingId,
  model: 'gpt-5.5', // optional per-message override
  reasoningEffort: 'low', // optional
  extraContext: MY_PROMPT, // optional
}

function MyPanel() {
  const messages = useAgent((s) => s.messages) // UIMessage[]
  const isRunning = useAgent((s) => s.isRunning)
  const error = useAgent((s) => s.error)
  const usage = useAgent((s) => s.usage) // { inputTokens, outputTokens }

  const send = (text: string) => useAgent.getState().sendMessage(text, config)
  // attachments: sendMessage(text, config, images?: ImageInput[], files?: FileAttachment[])

  return (
    <>
      {messages.map((m: UIMessage, i) => {
        if (m.type === 'assistant') return <Md key={i} text={m.text} />
        if (m.type === 'thinking') return <Collapsed key={i} text={m.text} />
        // m.type === 'tool': { name, label, status: 'running'|'done'|'error',
        //                      detail?, image? (snapshot data-url), download? }
        return <ToolChip key={i} {...m} />
      })}
      {error && <Error text={error} />}
      <Input onSubmit={send} disabled={isRunning} />
      {isRunning && <button onClick={() => useAgent.getState().stop()}>Stop</button>}
    </>
  )
}
```

- Non-React: same store via `useAgent.getState()` / `useAgent.subscribe()`.
- `useAgent((s) => s.codeLog)` (`CodeEvent[]`) holds the API-call log for a source view;
  `reset()` clears the conversation.

**Model/thinking pickers** — `provider.getCapabilities()` returns
`{ models: ModelOption[] }` (ids, context limits, reasoning levels); render your own
picker and pass the choice as `config.model` / `config.reasoningEffort`.

**Fully headless** — drive the raw event loop, no store, no React:

```ts
import { runAgentLoop } from '@buerli.io/ai'
for await (const ev of runAgentLoop('Create a 50mm box', [], config)) {
  // ev.type: 'text' | 'thinking' | 'tool_start' | 'tool_end'
  //        | 'subagent_start' | 'subagent_end' | 'usage' | 'error' | 'done'
}
```

**Custom provider** — one method; must support tool-use blocks. Optionally add
`getCapabilities()` to power the pickers:

```ts
const myProvider: LLMProvider = {
  async chat({ system, messages, tools, max_tokens, model, reasoningEffort }) {
    // call your LLM; return { content: ContentBlock[], stop_reason: 'end_turn' | 'tool_use' }
  },
}
```

**Pure-Node ESM** — `initAgent({ skillBundle, methodRegistry })` is the synchronous init
variant; pass the JSONs yourself
(`import bundle from '@classcad/skill/bundle.json' with { type: 'json' }`).

## GitHub Copilot (optional)

If your team has a GitHub Copilot subscription, the package ships a small local proxy
(browsers can't call `api.githubcopilot.com` directly):

```bash
npx copilot-proxy auth   # one-time GitHub device-flow login
npx copilot-proxy        # run on http://localhost:8788
```

Then `createAutoProvider({ apiKey: 'copilot-proxy', endpoint: 'http://localhost:8788/v1' })`.
The proxy stores a `COPILOT_OAUTH_TOKEN` in `./.env.local` — that token is a server-side
secret: keep the file gitignored and never expose it to client code. This is a development
convenience, not a multi-user production gateway. (For Node contexts where you already
hold a Copilot session token, `createCopilotProvider({ token })` calls the API directly.)
