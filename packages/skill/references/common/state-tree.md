# Structure tree (server state model)

The ClassCAD WS server sends the drawing's full structure tree with every `Result` frame — including non-mutating calls like `getAppVersion`. There are no incremental patches: every frame is a self-contained snapshot of current state (not a diff). Clients should cache the latest snapshot and answer structure queries from it.

## Configuration handshake

The mandatory `Configuration` command sent right after `open` enables structure delivery:

```js
{
  command: 'Configuration',
  config: {
    sendStructure: true,
    sendStructure_Patch: true,        // accepted but currently unused
    sendStructure_Immediately: false,
    // ... graphic flags ...
  },
}
```

Despite `sendStructure_Patch: true`, the server **always sends full snapshots** in `frame.structure`; don't assume patches are active.

## Snapshot shape

```ts
type StructureFrame = {
  root: id,                  // top of the visible tree (e.g. 1 = AllObjects)
  currentProduct: id,        // active part/assembly id (0 = none)
  currentInstance: id,       // active assembly instance id (0 = none)
  testRoot: id,
  tree: Record<string, Node>, // keyed by node.id (string-coerced)
}

type Node = {
  id: id,
  class: string,             // e.g. 'CC_Part', 'CC_Box', 'CC_EntitySet'
  name: string,
  parent: id | null,
  children?: id[],
  flags: number,
  members?: Record<string, { value, type, expression, visible }>,
  // domain-specific keys (e.g. expressionSet, geometrySet on CC_Part)
}
```

| Action | Tree size | Notes |
|---|---|---|
| Connect (after `clear` on prev run) | 1 node | Just `AllObjects` |
| `part.create` | +23 nodes | Part + ExpressionSet + GeometrySet + EntitySet + ... |
| `part.box` / `part.cylinder` | +3 nodes | Feature + supporting nodes |
| `part.updateBox` (param change) | +0 | Member values updated in place |
| `part.deleteFeature` | -3 nodes | Feature + supporting nodes removed |
| `common.clear` | back to 1 | AllObjects only |
| `common.getAppVersion` (read-only) | unchanged | Structure still included |

## Parent chain

Features are **not** direct children of their part:

```
AllObjects (root)
  └─ CC_Part
      ├─ CC_ExpressionSet
      ├─ CC_GeometrySet
      ├─ CC_EntitySet            ← features live here
      │   ├─ CC_Box
      │   └─ ...
      └─ ...
```

To check "is feature X under part Y?", walk `node.parent` upward until Y or null. `part.children` holds the part's sub-objects (ExpressionSet, GeometrySet, EntitySet, …), not features.

## Client caching strategy

Replace the cache wholesale on every Result frame:

```js
let lastStructure = null
function handleFrame(frame) {
  if (frame.command === 'Result' && frame.structure
      && typeof frame.structure === 'object' && !Array.isArray(frame.structure)) {
    lastStructure = frame.structure   // full snapshot
  }
}
```

The `!Array.isArray` check is forward-compat: if the server ever sends JSON-Patch deltas (RFC 6902, an array of ops), the cache goes stale instead of corrupt; then swap the assignment for an applier.

Any cheap read-only call (e.g. `getAppVersion`) forces a fresh frame. In practice the cache matches a fresh fetch byte-for-byte.

## Querying the cached tree

```js
tree()                   // full envelope { root, currentProduct, ..., tree }
tree({ id: 54 })         // single node by id, or null
tree({ type: 'CC_Box' }) // array of all CC_Box nodes
tree({ refresh: true })  // force a server round-trip first
```

Combine `{ id }` with parent-walking for ancestor checks; `{ type }` for inventory ("how many parts?", "all constraints in the active sketch").

## Findings & gotchas

- **Structure arrives on demand inside a script.** While a script runs the harness switches structure and graphics off on its connection (restored afterwards) and pulls the tree with one `GetTree` when `api.tree()` is read after a change — `GetTree` always returns the structure, whatever the flags. Repeated reads without a mutation in between are served from the cache. Outside a script every Result carries the structure again.
- **`updateBox` needs `openFeature` first** — without it the call fails with 1200 "not active and open"; inside open/close a parameter update returns maxLevel 31.
- **Tree size grows fast.** A part-create alone is 24 nodes / ~19 KB JSON; a modest assembly is easily 100+ nodes. Filter (`{type}`, `{id}`) before passing to LLMs or logging — full dumps belong in files.
