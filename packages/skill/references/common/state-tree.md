# Structure tree (server state model)

The ClassCAD WS server delivers the drawing's full structure tree alongside every
`Result` frame — including responses to non-mutating calls like `getAppVersion`.
There are no incremental patches in the current protocol; every frame is a
self-contained snapshot. Clients should cache the latest snapshot and answer
structure queries from that cache.

## Configuration handshake

The mandatory `Configuration` command sent right after `open` enables structure
delivery:

```js
{
  command: 'Configuration',
  config: {
    sendStructure: true,
    sendStructure_Patch: true,        // ← honoured by server but currently unused
    sendStructure_Immediately: false,
    // ... graphic flags ...
  },
}
```

Despite `sendStructure_Patch: true`, the server **always sends full snapshots** in
`frame.structure`. The patch flag appears reserved for future use; do not assume
it is active.

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

Empirically observed across mutations:

| Action                              | Tree size  | Notes                              |
| ----------------------------------- | ---------- | ---------------------------------- |
| Connect (after `clear` on prev run) | 1 node     | Just `AllObjects`                   |
| `part.create`                       | +23 nodes  | Part + ExpressionSet + GeometrySet + EntitySet + ... |
| `part.box`                          | +3 nodes   | Box feature + supporting nodes     |
| `part.updateBox` (param change)     | +0 nodes   | Topology unchanged; member values updated in place |
| `part.cylinder`                     | +3 nodes   | Same shape as box                  |
| `part.deleteFeature`                | -3 nodes   | Feature + supporting nodes removed |
| `common.clear`                      | back to 1  | Resets to AllObjects only          |
| `common.getAppVersion` (read-only)  | unchanged  | Still includes structure in frame  |

## Parent chain

Features do **not** live as direct children of their part. The hierarchy is:

```
AllObjects (root)
  └─ CC_Part
      ├─ CC_ExpressionSet
      ├─ CC_GeometrySet
      ├─ CC_EntitySet            ← features live here
      │   ├─ CC_Box
      │   ├─ CC_Cylinder
      │   └─ ...
      └─ ...
```

When checking "is feature X under part Y?", walk `node.parent` upward until you
hit Y or null. Do not rely on `part.children.includes(featureId)` — those are
the part's direct sub-objects (ExpressionSet, GeometrySet, EntitySet, etc.),
not features.

## Client caching strategy

A minimal, correct cache replaces wholesale on every Result frame:

```js
let lastStructure = null

function handleFrame(frame) {
  if (frame.command === 'Result') {
    if (frame.structure && typeof frame.structure === 'object'
        && !Array.isArray(frame.structure)) {
      lastStructure = frame.structure   // replace — full snapshots
    }
    // ...
  }
}
```

The defensive check (`!Array.isArray`) is forward-compat: if the server ever
flips on real JSON-Patch deltas (RFC 6902, an array of ops), the assignment
will not silently corrupt the cache — the caller will see a stale tree and can
diagnose. If/when patches arrive, swap the assignment for an applier.

To force a fresh frame, issue any cheap read-only call (e.g. `getAppVersion`) —
useful after long pauses or to verify cache integrity. In practice the cache
matches a fresh fetch byte-for-byte.

## Querying the cached tree

A small query layer over the cache pays off. Useful filters:

```js
tree()                 // full envelope { root, currentProduct, ..., tree }
tree({ id: 54 })       // single node by id, or null
tree({ type: 'CC_Box' }) // array of all CC_Box nodes
tree({ refresh: true })  // force a server round-trip first
```

Combine `{ id }` lookups with manual parent-walking for ancestor checks; combine
`{ type }` for inventory questions ("how many parts exist?", "list all
constraints in the active sketch").

## Findings & gotchas

- **Structure rides every Result frame.** No need for a separate `GetTree`
  command — the cache stays current as a side effect of any API call.
- **`updateBox` can return `maxLevel: 51` even when the update succeeds** —
  topology unchanged and the new value present in the tree. Error level alone
  is not proof of failure; verify against the tree.
- **`frame.structure` is the same on `getAppVersion` as on the previous mutation**
  — the server sends current state, not "state diff since last call".
- **Tree size grows fast.** A part-create alone is 24 nodes / ~19 KB JSON. A
  modest assembly is easily 100+ nodes. Filter (`{type}`, `{id}`) before
  passing to LLMs or logging — full dumps belong in files, not in a context
  window.
