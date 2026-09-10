---
name: drogon-ws-server
description: 'ClassCAD Drogon WebSocket server protocol and client implementation. Use when: writing or debugging WSClient code, implementing new WS commands, troubleshooting feature creation or auto-open behavior, understanding Drogon frame protocol, comparing SocketIO vs WS transport differences, handling session lifecycle, decoding binary graphic frames, filtering server trace messages, fixing message-level issues.'
---

# Drogon WebSocket Server — Agent Skill

## When to Use

- Implementing or modifying `WSClient.ts` (the raw WebSocket client for ClassCAD Drogon)
- Debugging why features don't auto-open, commands fail silently, or graphics don't appear
- Adding new commands or handling new frame types from the Drogon server
- Comparing behavior between SocketIOClient, WASMClient, and WSClient
- Understanding session lifecycle (ephemeral vs named, persistence, reconnection)
- Working with the ClassCAD API task format (`v1.namespace.function`)

## Key Files

| File                                                         | Role                                             |
| ------------------------------------------------------------ | ------------------------------------------------ |
| `packages/buerli/packages/classcad/src/io/WSClient.ts`       | WebSocket client implementation                  |
| `packages/buerli/packages/classcad/src/io/SocketIOClient.ts` | Socket.IO client (reference for behavior parity) |
| `packages/buerli/packages/classcad/src/io/AwvNodeClient.ts`  | Abstract base class for all IO clients           |
| `packages/buerli/packages/classcad/src/globals.ts`           | Auto-open/close feature subscription             |

For the full wire protocol, configuration flags, session lifecycle, frame schemas, LB protocol, and all server architecture details, see [protocol reference](./protocol.md).

## Protocol Summary

### Connection Flow

```
1. Open WebSocket → ws://host:port/  (port 9094 default dev)
2. Send SetEmissionConfig with the emission profile of this connection (optional —
   the default is full content on every Result; scripting sets everything off)
3. Send GetTree → receive full structure snapshot (always, whatever the flags)
4. Ready for Execute commands
```

### Outgoing Command Shape

```json
{
  "command": "Execute",
  "commandVersion": "v1",
  "transactionID": "<uuid>",
  "task": [{ "v1.namespace.function": [{ paramObject }] }],
  "options": { "undoable": true|false }
}
```

### Response Model (Multi-Frame)

One request → multiple frames → final `Result` frame:

```
Message  → intermediate messages          (_transactionID_ shared)
Structure → full structure snapshot
Patch    → incremental structure patches
[binary] → compressed graphic packages
Result   → FINAL frame, settles the promise
```

**Critical**: Field names from the server use underscores: `_from_`, `_transactionID_`.

## Critical Gotchas

### 1. INFO Trace Messages (Most Common Bug Source)

The Drogon server injects INFO-level (level=31) trace messages (`COMMANDCALL:`, `RETURN:`) into **every** successful response. These are absent from SocketIO/WASM responses. Consumer code that checks `messages.length === 0` for "clean success" will **always fail** unless messages are filtered to `level > 31`.

The WSClient filters these out before building the ServerResponse. If you see features created but not auto-opening, check this filtering.

### 2. Emission config is per connection

The server keeps the emission flags per connection: `SetEmissionConfig { config: {...} }` merges a partial set and echoes the effective flags, `GetEmissionConfig` echoes them. A fresh connection has full content in bundled delivery. A `config` field on any other request is ignored. `GetTree` always returns the structure and `v1.common.requestVisualisation` always returns its graphic, so a fully suppressed connection can still fetch both explicitly.

### 3. result Double-Wrapping

The `result` field may be `{ result: actualValue }`. Always unwrap:

```typescript
let jobResult = data.result
if (typeof data.result?.result !== 'undefined') {
  jobResult = data.result.result
}
```

### 4. Binary Frames are deflate-raw

Use `pako.inflate(data, { raw: true })` — not plain `inflate()` which expects zlib headers.

### 5. Undo State Not Pushed

Unlike SocketIOClient which receives `undo` events with `{ stack, current, id }`, the Drogon WS server does **not** push undo/redo state changes. This is a known gap.

### 6. Session Behavior

- No `?session=` param → ephemeral session (destroyed on disconnect)
- With `?session=<uuid>` → named session (persists, can be shared with HTTP)
- Active WS connections protect sessions from cleanup timer eviction

## Feature Auto-Open Flow

When a feature is created via the toolbar, the call chain is:

```
User clicks "Add Extrusion"
  → wrapper() calls partApi.createUncommitedObject(...)
  → WSClient.request() sends Execute command
  → Server returns Result with result: <featureId>
  → wrapper checks: res.messages.length === 0 && res.result !== null
  → If true: pluginApi.setActiveFeature(res.result)
  → globals.ts subscription detects active feature change
  → Calls openFeature() → plugin renders
```

The `messages.length === 0` check is why INFO trace messages must be filtered out.

## Procedure: Adding a New Command Type

1. Read [protocol reference](./protocol.md) for the full frame schema
2. Add the command to `WSClient.ts` following the `undo()`/`redo()` pattern
3. Use `this.requestByName()` which handles transaction tracking, pending map, and response settlement
4. Ensure the command name matches what the server's `CommandFactory` expects
5. Test against a live server (default: `ws://localhost:9094/`)

## Procedure: Debugging Response Issues

1. Add `console.log` in `handleFrame()` to see raw frames
2. Check `data.command` — is it `Result` (final) or intermediate?
3. Check `data.messages` — are there INFO traces inflating the count?
4. Check `data.maxLevel` — 31 = info only (success), 51+ = error
5. Check `data.result` — is it double-wrapped?
6. Compare with SocketIOClient behavior for the same command

## Standalone Node.js Client — Verified Working Pattern

A proven, minimal WebSocket client pattern for scripting against ClassCAD from Node.js (no `@buerli.io/classcad` package needed). The reusable client is at [harness/client.mjs](../harness/client.mjs).

### Prerequisites

```bash
npm install ws   # only dependency — Node.js built-in crypto for UUIDs
```

### Minimal Client Skeleton

```js
import WebSocket from 'ws'
import { randomUUID } from 'crypto'

const WS_URL = 'ws://0.0.0.0:9094/'   // default dev port
const pending = new Map()
let ws

function send(obj) { ws.send(JSON.stringify(obj)) }

function request(command, extra = {}) {
  const transactionID = randomUUID()
  return new Promise((resolve, reject) => {
    const entry = { resolve, reject, frames: [] }
    pending.set(transactionID, entry)
    send({ command, commandVersion: 'v1', transactionID, ...extra })
    setTimeout(() => {
      if (pending.has(transactionID)) {
        pending.delete(transactionID)
        reject(new Error('Timeout: ' + command))
      }
    }, 30000)
  })
}

function execute(task) {
  return request('Execute', { task: [task], options: { undoable: false } })
}

function handleFrame(data, isBinary) {
  if (isBinary) return                       // skip graphic frames
  let frame
  try { frame = JSON.parse(data.toString()) } catch { return }
  const txId = frame._transactionID_         // NOTE: underscores!
  if (!txId) return                          // Config responses have no txId
  const entry = pending.get(txId)
  if (!entry) return
  entry.frames.push(frame)
  if (frame.command === 'Result') {          // ONLY settle on Result
    pending.delete(txId)
    let result = frame.result
    // Unwrap double-wrapped result
    if (result && typeof result === 'object' && 'result' in result
        && Object.keys(result).length <= 3) {
      result = result.result
    }
    // Filter INFO traces (level 31) — critical!
    const messages = (frame.messages || []).filter(m => m.level > 31)
    entry.resolve({ result, messages, structure: frame.structure })
  }
}
```

### Connection + SetEmissionConfig (scripting profile)

```js
ws = new WebSocket(WS_URL)
await new Promise((resolve, reject) => {
  ws.on('open', resolve)
  ws.on('error', reject)
})
ws.on('message', (data, isBinary) => handleFrame(data, isBinary))

// Per-connection emission config: set once, restore/change any time.
// Scripting wants results only — the tree comes from GetTree on demand.
await request('SetEmissionConfig', {
  config: {
    sendStructure: true,          // get structure in Result frames
    sendStructure_Patch: true,
    sendStructure_Immediately: false,
    sendGraphic_Kernel: false,    // disable all graphics for scripting
    sendGraphic_StructureObj: false,
    sendGraphic_Sketch: false,
    sendGraphic_Compressed: false,
    sendGraphic_Immediately: false,
    sendGraphic_ImmediatelyBinary: false,
    sendGraphic_Multipackage: false,
    sendMessages: true,
    sendMessages_Immediately: false,
  },
})   // tracked: resolves with the effective flags in `result`
```

### Key Findings from Live Testing

#### SetEmissionConfig replies with the effective flags
`result` is the full flag set after the merge — feed it back into a later `SetEmissionConfig` to restore. (The legacy `Configuration` command still answers with the benign `maxLevel: 51` "ClassCAD is already initialized!" message.)

#### `ws.on('message')` callback signature
With the `ws` npm package, the callback is `(data, isBinary)` — **not** `(data)`. Check `isBinary` to skip binary graphic frames. Checking `Buffer.isBuffer(data)` alone is unreliable because text frames also arrive as Buffers.

#### Disable all `sendGraphic_*` flags for scripting
Graphics produce binary frames and bloat responses. For headless scripting (no 3D viewport), switch all graphic categories off with `SetEmissionConfig`. Scope it to a script (read the config, suppress, run, restore — what `@classcad/script`'s `runScript` does) rather than for the whole connection: in a shared session the server broadcasts what YOU emit, so a permanently suppressed client starves the other participants. To read the graphic while suppressed either switch `sendGraphic_Kernel` on around one `GetTree` or call `v1.common.requestVisualisation({ ids })` for specific solids — it delivers its graphic regardless of the flags.

#### Set `sendStructure_Immediately: false` for scripting
When `true`, structure arrives as intermediate frames that need separate handling. When `false`, structure is bundled into the final `Result` frame, simplifying the client.

#### `result` values are raw ClassCAD IDs (integers)
Part creation returns a numeric ID (e.g., `4`). Entity injection returns a numeric ID (e.g., `54`). These are the IDs you pass to subsequent API calls.

#### Box is centered at origin
`api.v1.solid.box` creates a box centered at `[0,0,0]`. A 100×60×40 box occupies `[-50,-30,-20]` to `[50,30,20]`. The CoG is `[0,0,0]`.

#### BRep element IDs are negative integers
Face, edge, and vertex IDs in ClassCAD are **negative** integers (e.g., face=-1, edge=-20, vertex=-27). This is normal — don't filter them as errors.

#### `getGeometryPositions` returns `{x,y,z}` objects, not arrays
Points come back as `{"x":50,"y":30,"z":20}` — not `[50,30,20]`. Format accordingly.

#### Workflow: Part → Entity Injection → Solid

```js
// 1. Create part (clears drawing, returns part ID)
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// 2. Create entity injection feature (required for solid/curve APIs)
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// 3. Create solid inside the entity injection
const boxId = (await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })).result

// 4. Query volume + center of gravity
const mass = (await api.v1.part.calculateMassProperties({ id: partId })).result
// → { cog: {x:0, y:0, z:0}, volume: 240000 }

// 5. Enumerate BRep faces (box has 6)
for (let i = 0; i < 10; i++) {
  const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, faceIndex: i })
  if (!r.result) break
  console.log('Face', i, '→ id', r.result)
}
// Similarly: lineIndex for edges, pointIndex for vertices

// 6. Get positions for BRep elements
const positions = (await api.v1.part.getGeometryPositions({ elems: [faceId1, edgeId2] })).result
// → [{ id: -1, positions: [{x,y,z}, ...] }, ...]

// 7. Get full structure tree (raw protocol — not available through api.v1.*).
//    GetTree returns the structure even when sendStructure is off.
const tree = await request('GetTree')
// → tree.structure.tree has all objects with members, children, etc.
```

### Expected Output for a 100×60×40 Box

```
Volume:    240000
CoG:       [0, 0, 0]
Faces:     6   (top, bottom, front, back, left, right)
Edges:     12  (4 per axis-aligned layer)
Vertices:  8   (corners of the box)
Euler:     V-E+F = 8-12+6 = 2 ✓

Bounding box:  [-50,-30,-20] to [50,30,20]

Vertices:
  [-50,-30,-20]  [50,-30,-20]  [-50,30,-20]  [50,30,-20]
  [-50,-30, 20]  [50,-30, 20]  [-50,30, 20]  [50,30, 20]
```
