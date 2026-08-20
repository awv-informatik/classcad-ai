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
- **Live reasoning ticker** — the model's thinking streams into the panel while it
  works (all built-in providers stream), so long silent stretches show progress.
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

| Tool                              | Purpose                                                                                                                                                                                                                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run_script`                      | THE execution medium: model-written JavaScript — `await api.v1.*`, `api.tree()`, `api.graphic()`; single ops and full builds alike; follow-up scripts attach to the existing model                                                                                                                       |
| `tree` / `find` / `inspect`       | Read the structure tree, search nodes, full node detail                                                                                                                                                                                                                                                  |
| `get_selection` / `set_selection` | Read or set the user's 3D selection                                                                                                                                                                                                                                                                      |
| `list_methods`                    | Discover methods: the documented v1 surface (264 methods, ranked keyword search with CAD synonyms) plus live reflection of the buerli namespaces                                                                                                                                                         |
| `docs`                            | Bulk documentation — many keys in one call: per-method docs, topic guides (`DATA`, …), API overviews, worked recipes (`recipes/verification` is mandatory reading for every build). Same single-source discovery as the ClassCAD MCP server                                                              |
| `snapshot`                        | Deterministic render of the drawing (@classcad/renderer): standard views, section, sheet, highlightAt, markers, annotate, x-ray, frame pinning — sent to the model as vision when the selected model supports it; tessellation is auto-tightened for the image and restored (`quality: 'fast'` opts out) |
| `checkpoint` / `restore`          | In-memory save/rollback of the whole drawing — failed attempts become cheap                                                                                                                                                                                                                              |
| `notes`                           | Persistent per-drawing scratchpad (plan, key ids) that survives context pruning                                                                                                                                                                                                                          |
| `ask_user`                        | Blocking question(s) to the user — ends the turn; the reply arrives as the next message                                                                                                                                                                                                                  |
| `fetch_url`                       | One GET through the local proxy (see below): a page as readable text plus the image URLs it shows, or an image itself. A fetched image becomes a conversation reference image, so the verification gates apply to it as to an attachment. Not a browser — no link following, no logins, and no JavaScript execution |
| `load_file`                       | Import a user-attached CAD file                                                                                                                                                                                                                                                                          |
| `download`                        | Export STEP/STL/OFB as a download button in the chat                                                                                                                                                                                                                                                     |
| `delegate`                        | Hand a sub-task to a specialist sub-agent (sketch, boolean, fillet_chamfer, assembly, analysis — layered on the full base prompt). `perception` is the exception: a fresh-eyes image reader with NO CAD prompt and no task context, given `withImages` (the user's references) and optionally `withSnapshots` (your renders) so it can judge a render against the reference itself |

Everything executes in the browser against the buerli API — no extra server for CAD.
The ClassCAD knowledge (method registry + curated docs + recipes) ships via the
`@classcad/skill` dependency and loads with `initAgentAsync()`. (`TOOL_SCHEMAS` and
`executeTool` are exported for tests or custom executors.)

Long sessions stay healthy on their own: oversized tool results are size-capped, and
when the history approaches the model's context window, old tool results are pruned —
recent turns, all conversation text, and the agent's `notes` survive.

## Inside the agent loop

`runAgentLoop` is a plain tool-use cycle with two kinds of self-correction layered on:

- **Recovery nudges** — bounded, synthetic user messages that repair transport/model
  hiccups instead of killing the run: a provider that reports a tool call but drops the
  payload is asked to re-issue it; a response truncated at the output cap is told to
  continue where it left off; a model that narrates intent ("let me build…") without
  emitting the call is nudged to act. Transient endpoint errors are retried.
- **Verification gates** (reference-image turns) — the enforcement arm of
  `recipes/verification`, in code where it cannot be argued away: the first
  `run_script` is blocked until an isolated `perception` reader has read the drawing
  (one question per reader — in-task readings are the measured failure mode), and the
  turn cannot end until a fresh reader judged an A|B pair render against the reference
  image. Each gate fires at most once per turn, so a stubborn model ends the turn
  rather than looping. Reference images are tracked across the whole conversation,
  and an image pulled by `fetch_url` is registered as one — otherwise a drawing
  arriving as a tool result would walk past every gate.
- **Sub-agents** — `delegate` runs a nested loop one level deeper (no re-delegation),
  persona layered on top of the full base prompt. Exception: the `perception` reader
  runs with NO base prompt — fresh, task-free context is its entire value; it can be
  handed the user's reference images (`withImages`) and recent snapshot renders
  (`withSnapshots`) for judging.

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
- `useAgent((s) => s.liveThinking)` — the in-flight reasoning text while a round
  streams (`null` otherwise); render it for a live "thinking" ticker.

**Model/thinking pickers** — `provider.getCapabilities()` returns
`{ models: ModelOption[] }` (ids, context limits, reasoning levels); render your own
picker and pass the choice as `config.model` / `config.reasoningEffort`.

**Fully headless** — drive the raw event loop, no store, no React:

```ts
import { runAgentLoop } from '@buerli.io/ai'
for await (const ev of runAgentLoop('Create a 50mm box', [], config)) {
  // ev.type: 'text' | 'thinking' | 'image' | 'tool_start' | 'tool_end'
  //        | 'subagent_start' | 'subagent_end' | 'usage' | 'error' | 'done'
}
```

Events arrive per completed block. For token-level streaming, set
`config.onStreamDelta = ({ thinking, text }) => …` — the built-in providers stream
deltas whenever the callback is present (this is what feeds the panel's live ticker).

**Custom provider** — one method; must support tool-use blocks. Optionally add
`getCapabilities()` to power the pickers. Streaming is optional: when `chat()` receives
an `onDelta` callback in its params, pipe `{ thinking?, text? }` chunks through it as
they arrive and still return the complete response at the end:

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

## The local proxy (GitHub Copilot + web fetch)

The package ships a small local proxy for the two things a browser cannot do itself:
call `api.githubcopilot.com` (if your team has a Copilot subscription), and fetch
arbitrary web pages (CORS):

```bash
npx copilot-proxy auth   # one-time GitHub device-flow login
npx copilot-proxy        # run on http://localhost:8788
```

Then `createAutoProvider({ apiKey: 'copilot-proxy', endpoint: 'http://localhost:8788/v1' })`.
The proxy stores a `COPILOT_OAUTH_TOKEN` in `./.env.local` — that token is a server-side
secret: keep the file gitignored and never expose it to client code. This is a development
convenience, not a multi-user production gateway. (For Node contexts where you already
hold a Copilot session token, `createCopilotProvider({ token })` calls the API directly.)

### `POST /v1/fetch` — the web fetch behind `fetch_url`

`{ "url": "https://…" }` → `{ kind: 'text', title, text, images[] }` for HTML/JSON/plain
text (markup stripped, entities decoded, the page's image URLs resolved absolute), or
`{ kind: 'image', mediaType, base64 }` for png/jpeg/gif/webp. Independent of Copilot —
it works whether or not you use Copilot as the model provider.

A local process fetching model-chosen URLs is an SSRF risk: it can reach what the page
cannot — your CAD worker on `:9094`, LAN devices, cloud metadata at `169.254.169.254`.
The endpoint is therefore bounded, and the bound that matters is the third one:

- http/https only, **ports 80/443 only**, GET only, 5 MB and 15 s caps;
- **every resolved ADDRESS is checked, not the hostname** — private, loopback, link-local,
  CGNAT and multicast ranges are refused at the socket's DNS lookup, so a name that
  resolves public once and private on the next lookup (DNS rebinding) cannot get through;
- every redirect hop is re-validated the same way;
- no credentials, no cookies, no local headers outbound; nothing set inbound;
- content-type allowlist — anything else is rejected rather than guessed at.

**It cannot run JavaScript.** Client-rendered pages return a near-empty shell; static
pages, docs, raw files, API endpoints and images work. When a fetched HTML page yields
almost no text, the response says so and suggests a direct resource URL instead.
