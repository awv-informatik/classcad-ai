# Drogon WebSocket Protocol — Complete Reference

The ClassCAD Drogon server exposes a raw WebSocket interface (no Socket.IO) on configurable routes. This document describes the full wire protocol from the client's perspective, verified against ClassCAD 21.0.1-dev.

---

## 1. Server Architecture

`DrogonServer` hosts two controllers on the same port:

| Controller             | Transport | Routes                                                             |
| ---------------------- | --------- | ------------------------------------------------------------------ |
| `DrogonHttpController` | HTTP      | `GET/DELETE /session`, `POST /api`, `POST /command`, `GET /status` |
| `DrogonWsController`   | WebSocket | `/`, `/command`, `/api`                                            |

Both controllers share a single `CtrlContext`, which means HTTP and WS clients can share the same named session simultaneously. All access is serialised through a `requestQueue` (`ThreadSafeTaskPool`), so no additional locking is needed.

### Server Configuration (`[network]` section in `.classcad.ini`)

| Key                           | Default               | Description                                                                                                         |
| ----------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `session_timeout_ms`          | `60000`               | Idle time before session is evicted to disk; `0` = never evict                                                      |
| `session_cleanup_interval_ms` | `5000`                | How often the cleanup timer fires                                                                                   |
| `session_state_dir`           | `<exe>/session_state` | Directory for persisted session state `.ofb` files (`off` to disable)                                               |
| `session_state_max_age_ms`    | `0`                   | Max age of state files on disk; `0` = no age limit (all files deleted at startup, kept indefinitely during runtime) |
| `host`                        | `0.0.0.0`             | Listen address                                                                                                      |
| `hport` / `wport`             | `80`                  | HTTP / WS port (may be the same; dev default **9094**)                                                              |
| `ssl.hport` / `ssl.wport`     | `443`                 | HTTPS / WSS port                                                                                                    |
| `ssl.crtfile` / `ssl.keyfile` | _(empty)_             | TLS certificate and key                                                                                             |
| `webhook_auth`                | _(empty)_             | URL for authorization webhook (`off` to disable)                                                                    |
| `webhook_state`               | _(empty)_             | URL for state save webhook                                                                                          |
| `webhook_timeout_ms`          | `5000`                | Timeout for webhook HTTP calls; 0 = no timeout                                                                      |

---

## 2. WebSocket Connection

### Endpoints

| Route      | Purpose                   |
| ---------- | ------------------------- |
| `/`        | General-purpose (default) |
| `/command` | Command-oriented          |
| `/api`     | API-oriented              |

All three accept the same frame protocol.

### URL Format

```
ws://<host>:<port><path>[?session=<sessionId>]
```

### Session Types

| Scenario           | Behavior                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| No `session` param | **Ephemeral session** — created on connect, destroyed on disconnect         |
| `session=<uuid>`   | **Named session** — persists beyond the connection, can be shared with HTTP |

Named sessions are created via `GET /session` on the HTTP controller and deleted via `DELETE /session`.

### Handshake

Standard WebSocket upgrade — no sub-protocols or custom headers required. After the socket opens, the client **must** send a `Configuration` command before any other commands.

---

## 3. Session Lifecycle

### Session State Machine

```
                     ┌──────────────────────────────┐
                     │         IN MEMORY            │
                     │  useCount > 0: request active│
                     │  useCount = 0: idle          │
                     └────────────┬─────────────────┘
                                  │
                    idle >= session_timeout_ms
                    (cleanup timer fires)
                                  │
                                  ▼
                     ┌──────────────────────────────┐
                     │         ON DISK              │
                     │  <stateDir>/<ts>_<id>.ofb    │
                     │  protected if WS open        │
                     └────────────┬─────────────────┘
                                  │
               age > session_state_max_age_ms
               AND no active WS connection
                                  │
                                  ▼
                            FILE DELETED
```

### WS Protection

Active WS connections protect session state files from the cleanup timer via a ref-counted map (`wsActiveConnections`):

- `RegisterWsConnection(id)` on connect
- `UnregisterWsConnection(id)` on disconnect

A browser tab left open for hours can transparently resume after the in-memory session was evicted.

### Cleanup Timer

Fires every `session_cleanup_interval_ms`:

1. **Memory eviction**: idle sessions (useCount=0, age >= timeout) → saved to `.ofb` file, removed from memory
2. **File cleanup**: state files older than `session_state_max_age_ms` → deleted, unless session has an active WS connection

### WS Connection Lifecycle

```
handleNewConnection:
  ├─ FindSession(sessionId) or RestoreSessionFromFile
  ├─ RegisterWsConnection(sessionId)
  └─ setContext(ConnContext)

handleNewMessage:
  ├─ FindSession (or restore from file; maxAgeMs=0 for WS-protected files)
  ├─ Acquire session (useCount++)
  ├─ Execute command
  └─ Release session (useCount--)

handleConnectionClosed:
  ├─ UnregisterWsConnection(sessionId)
  └─ if ephemeral: RemoveSession + DeleteStateFiles
```

### Reconnect Scenarios (named session)

| Delay                        | State           | Result              |
| ---------------------------- | --------------- | ------------------- |
| < `session_timeout_ms`       | Still in memory | Instant resume      |
| timeout … max_age            | Evicted to disk | Transparent restore |
| > `session_state_max_age_ms` | File deleted    | Connection rejected |

### HTTP Endpoints (for session management)

```
GET /session                    → creates named session, returns UUID
DELETE /session                 → removes session + state files
POST /api (+ session header)   → execute command on named session
POST /api (no header)          → ephemeral session for single request
GET /status                    → server health check
```

---

## 4. Frame Types

| Direction       | Frame type | Content                                      |
| --------------- | ---------- | -------------------------------------------- |
| Client → Server | Text       | JSON command object                          |
| Server → Client | Text       | JSON response frame(s)                       |
| Server → Client | Binary     | Compressed SCG graphic package (deflate-raw) |

---

## 5. Outgoing Commands (Client → Server)

All commands are JSON text frames:

```json
{
  "command": "<CommandName>",
  "commandVersion": "v1",
  "transactionID": "<uuid>",
  ...commandSpecificFields
}
```

### 5.1 Configuration (required first command)

```json
{
  "command": "Configuration",
  "commandVersion": "v1",
  "config": {
    "sendStructure": true,
    "sendStructure_Patch": true,
    "sendStructure_Immediately": true,
    "sendGraphic_Kernel": true,
    "sendGraphic_StructureObj": true,
    "sendGraphic_Sketch": true,
    "sendGraphic_Compressed": true,
    "sendGraphic_Immediately": true,
    "sendGraphic_ImmediatelyBinary": true,
    "sendGraphic_Multipackage": true,
    "sendMessages": true,
    "sendMessages_Immediately": true
  }
}
```

No `transactionID` needed. Without this command, the server will not push any data back.

**Flag effects:**

| Flag                            | Controls                                        |
| ------------------------------- | ----------------------------------------------- |
| `sendStructure`                 | Full structure snapshot in Result frames        |
| `sendStructure_Patch`           | Incremental structure patches                   |
| `sendStructure_Immediately`     | Push structure as intermediate frames           |
| `sendGraphic_Kernel`            | Kernel-level graphics                           |
| `sendGraphic_StructureObj`      | Structure-object graphics                       |
| `sendGraphic_Sketch`            | Sketch graphics                                 |
| `sendGraphic_Compressed`        | Compress graphic payloads                       |
| `sendGraphic_Immediately`       | Push graphics as intermediate frames            |
| `sendGraphic_ImmediatelyBinary` | Send graphics as binary WS frames (deflate-raw) |
| `sendGraphic_Multipackage`      | Batched/multi-package graphics                  |
| `sendMessages`                  | Messages in Result frames                       |
| `sendMessages_Immediately`      | Push messages as intermediate Message frames    |

### 5.2 Execute (run a ClassCAD API command)

```json
{
  "command": "Execute",
  "commandVersion": "v1",
  "transactionID": "<uuid>",
  "task": [{ "<namespace>.<function>": [<params>] }],
  "options": { "undoable": true }
}
```

**Task format**: Array with one entry. The key is the API path, the value is an array of parameters.

Examples:

```json
{ "task": [{ "v1.part.create": [{}] }] }
{ "task": [{ "v1.part.create": [{ "name": "MyPart" }] }] }
{ "task": [{ "v1.sketch.create": [{ "id": 4, "planeId": 12 }] }] }
{ "task": [{ "v1.part.createUncommitedObject": [{ "id": 4, "type": "CC_Extrusion", "name": "Extrusion" }] }] }
{ "task": [{ "v1.part.openFeature": [{ "id": 52 }] }] }
{ "task": [{ "v1.part.closeFeature": [{ "id": 52 }] }] }
{ "task": [{ "v1.common.setDatabaseSettings": [{ "isGraphicEnabled": true }] }] }
```

The `id` parameter refers to the ClassCAD object ID (integer) returned by previous commands.

**Options:**

- `undoable: true` — server creates an undo checkpoint
- `undoable: false` / omitted — no checkpoint

### 5.3 GetTree (fetch full object tree)

```json
{
  "command": "GetTree",
  "commandVersion": "v1",
  "transactionID": "<uuid>"
}
```

### 5.4 StoreState (undo)

```json
{
  "command": "StoreState",
  "commandVersion": "v1",
  "transactionID": "<uuid>",
  "options": {}
}
```

### 5.5 LoadState (redo)

```json
{
  "command": "LoadState",
  "commandVersion": "v1",
  "transactionID": "<uuid>",
  "options": {}
}
```

### 5.6 Stream data (binary uploads)

Streams are base64 deflate-raw encoded in `streamData`:

```json
{
  "command": "Execute",
  "commandVersion": "v1",
  "transactionID": "<uuid>",
  "task": [{ "v1.part.importFile": [{ ... }] }],
  "streamData": { "streamKey": "<base64-encoded deflate-raw data>" }
}
```

---

## 6. Incoming Frames (Server → Client)

### 6.1 Multi-frame response model

A single request can produce **multiple** text frames before the final `Result` frame. All frames share the same `_transactionID_` (note the underscores — Drogon naming convention).

Typical sequence with `*_Immediately` flags:

```
Client sends Execute (transactionID: "abc-123")
  ↓
Server: { command: "Message",   _transactionID_: "abc-123", messages: [...] }
Server: { command: "Structure", _transactionID_: "abc-123", structure: {...} }
Server: { command: "Patch",     _transactionID_: "abc-123", structurePatch: [...] }
Server: [binary frame — compressed graphic package]
Server: { command: "Result",    _transactionID_: "abc-123", result: ..., ... }  ← FINAL
```

The `Result` frame is always **last**. Only settle the client-side promise on `Result`.

### 6.2 Text frame schema

```typescript
{
  command: "Message" | "Structure" | "Patch" | "Graphic" | "Result",
  _from_: string,                // e.g. "Execute", "Configuration", "GetTree"
  _transactionID_?: string,      // matches outgoing transactionID
  result?: any,                  // on Result frames
  structure?: IStructureProtocol,// full structure snapshot
  structurePatch?: any[],        // JSON Patch operations
  graphic?: any,                 // inline graphic data (text)
  maxLevel?: number,             // highest message severity
  messages?: Message[],          // server messages
  streamData?: Record<string, string> // base64-encoded response streams
}
```

### 6.3 Frame types

| `command`   | When sent                                            | Key fields                                |
| ----------- | ---------------------------------------------------- | ----------------------------------------- |
| `Message`   | Intermediate (`sendMessages_Immediately`)            | `messages`, `maxLevel`                    |
| `Structure` | Intermediate (`sendStructure_Immediately`)           | `structure`                               |
| `Patch`     | Intermediate (`sendStructure_Patch` + `Immediately`) | `structurePatch`                          |
| `Graphic`   | Intermediate (text-based graphic)                    | `graphic`                                 |
| `Result`    | **Final frame** — settles the request                | `result`, and optionally all above fields |

### 6.4 Binary frames (graphics)

With `sendGraphic_ImmediatelyBinary`, graphics arrive as binary WS frames containing deflate-raw compressed JSON:

```typescript
const inflated = pako.inflate(data, { raw: true, to: 'string' })
const pkg = JSON.parse(inflated)
```

Fallback: if inflation fails, try parsing as raw JSON (uncompressed).

### 6.5 Configuration response

No `_transactionID_` — these are untracked:

```json
{ "command": "Message", "_from_": "Configuration", "maxLevel": 51, "messages": [...] }
{ "command": "Result", "_from_": "Configuration", "result": 1 }
```

A `maxLevel: 51` message `"ClassCAD is already initialized!"` is **normal** — the engine was initialized by a prior session.

---

## 7. Message Levels

| Name      | Value |
| --------- | ----- |
| `unknown` | -1    |
| `trace`   | 11    |
| `debug`   | 21    |
| `info`    | 31    |
| `warning` | 41    |
| `error`   | 51    |
| `fatal`   | 61    |

Each message:

```typescript
{
  levelStr: "INFO" | "ERROR" | "WARNING" | ...,
  level: number,
  code: number,       // 0 = no specific code
  message: string,
  api?: string        // e.g. "v1.part.createUncommitedObject"
}
```

### Trace messages (critical gotcha)

The Drogon server includes **INFO-level trace messages** in every successful response:

```json
{
  "messages": [
    { "levelStr": "INFO", "level": 31, "code": 0, "message": "COMMANDCALL: _C.SafeAPI.Execute([...])\n" },
    { "levelStr": "INFO", "level": 31, "code": 0, "message": "RETURN: {\"result\":\"$52\"}\n" }
  ],
  "maxLevel": 31
}
```

**These are NOT present in SocketIO or WASM responses.** Consumer code checking `messages.length === 0` for "clean success" must filter to `level > 31` first. The WSClient does this automatically.

### Error detection

A response is an error when `maxLevel >= 51`:

```json
{
  "maxLevel": 51,
  "messages": [
    {
      "api": "v1.part.createUncommitedObject",
      "code": 1001,
      "level": 51,
      "levelStr": "ERROR",
      "message": "The parameter \"id\" has a wrong id type!"
    }
  ]
}
```

---

## 8. Structure Data

### Full snapshot (`structure`)

```json
{
  "root": 4,
  "currentProduct": 4,
  "currentInstance": 0,
  "testRoot": 0,
  "tree": {
    "1": { "name": "AllObjects", "class": "AllObjects", "id": 1, "flags": 0, "parent": null },
    "4": { "name": "Part", "class": "CC_Part", "id": 4, "flags": 0, "parent": 1, "members": {...} }
  }
}
```

### Patches (`structurePatch`)

```json
[
  { "op": "replace", "path": "/tree/52/members/Height/value", "value": 30 },
  { "op": "add", "path": "/tree/99", "value": { "name": "Sketch", "class": "CC_Sketch", ... } }
]
```

---

## 9. Result Unwrapping

The `result` field may be double-wrapped:

```typescript
let jobResult = data.result
if (typeof data.result?.result !== 'undefined') {
  jobResult = data.result.result
}
```

Feature creation commands return the **object ID** (integer) of the new feature.

---

## 10. Response Stream Data

Some commands return binary data via `streamData` — base64-encoded deflate-raw:

```json
{ "streamData": { "geometry": "<base64>" } }
```

Decode: `pako.inflate(new Uint8Array(base64Decode(value)), { raw: true })`

---

## 11. Load Balancer Protocol

The WS controller supports an optional LB routing header:

### Wire Format (request)

```
HEADER;;;{headerPayloadLen};;;{taskId};;;{sessionId};;;{actualBody}
```

| Field              | Description                                                                   |
| ------------------ | ----------------------------------------------------------------------------- |
| `headerPayloadLen` | Byte length of header payload (allows future fields without breaking workers) |
| `taskId`           | Opaque correlation ID from the LB                                             |
| `sessionId`        | Session override (overrides per-connection session)                           |
| `actualBody`       | The JSON command payload                                                      |

The worker echoes `headerStr` verbatim at the start of every response frame. For binary frames, the header bytes are prepended to the binary payload. When no LB is present (`headerStr` empty), frames are bare payload.

---

## 12. Differences from Socket.IO Protocol

| Aspect           | Socket.IO (old)                                  | Drogon WS (new)                           |
| ---------------- | ------------------------------------------------ | ----------------------------------------- |
| Transport        | Socket.IO envelope (`42[event, ...]`)            | Raw WebSocket JSON                        |
| Framing          | `BeginFrame` / `EndFrame` wrapping               | Multi-frame with final `Result`           |
| Field names      | `from`, `transactionID`                          | `_from_`, `_transactionID_` (underscored) |
| Binary data      | Socket.IO binary event                           | Raw binary WS frames                      |
| Acknowledgements | Socket.IO callback ack                           | No ack needed                             |
| Undo events      | Dedicated `undo` event: `{ stack, current, id }` | **Not yet implemented**                   |
| INFO traces      | Not included                                     | Included (must filter `level <= 31`)      |
| Configuration    | Implicit on init                                 | Explicit command required                 |

---

## 13. Known Gotchas

1. **Must send Configuration first** — without it, no data is pushed back.
2. **INFO trace messages inflate `messages.length`** — filter `level > 31` before checking success.
3. **Configuration "already initialized" is normal** — benign `maxLevel: 51` on engine reuse.
4. **`result` may be double-wrapped** — always check `data.result?.result`.
5. **Binary frames are deflate-raw** — use `pako.inflate(data, { raw: true })`, not `inflate(data)`.
6. **Undo/Redo state not pushed** — unlike Socket.IO, no `undo` events. Client must manage state from results.
7. **`_transactionID_` uses underscores** — server field names differ from outgoing command field names.
8. **No session param → ephemeral** — session deleted when socket closes.
