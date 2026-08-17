# sketch.getObjectsLists

Returns the sketch's object inventory as id lists — the fastest way to grab
"every constraint" or "the profile curves" without walking the tree.

```js
const r = await api.v1.sketch.getObjectsLists({ id: sketchId })
r.result === {
  points: [...],                // every CC_Point (start/end/center points included)
  lines: [...], circles: [...], arcs: [...],
  constructionGeometry: [...],  // subset view — these ids ALSO appear in lines/circles/arcs
  solidGeometry: [...],         // profile-capable curves (no construction, no points) —
                                // good candidates for extrusion `references`
  constraints: [...],           // ALL constraints, including auto-generated
                                // (Auto_Fix / Auto_H / Auto_Coinc) — expect more than you created
  dimensions: [...],            // the SOLVER-side dimensional constraints (see trap below)
}
```

All ids are tree ids (session-stable).

## Traps

- **`dimensions` lists the solver constraints (`CC_2D*Constraint`), NOT the
  display entities.** `sketch.dimension()` returns the DISPLAY entity
  (`CC_*FeatureDimension` under `CC_DimensionSet › CC_SketchDimensionSet`) —
  that id will NOT appear in this list; the list holds its `members.master`
  counterpart. Joining `dimension()` results against `dimensions` yields zero
  matches. Read `@expr` bindings from either node's members.
- **`id` must be a sketch id.** A part id or stale id fails with maxLevel 51
  and `result: null` — guard `r.result` before indexing
  (`r.result?.constraints ?? []`), or `.constraints` throws on null.
- Works unchanged on CONSUMED sketches (after extrusion etc.).
- AGENT NOTE: one in-app run (browser/WASM engine build) observed `result:
  null` with maxLevel 31 on a valid sketch id — not reproducible on the
  current native worker. If the result is null despite a valid id, fall back
  to the tree scan (see [STRUCTURE.md](../../../script/docs/STRUCTURE.md)
  sketch anatomy): constraints are `*Constraint` children of the `CC_Sketch`,
  display dims live under `CC_SketchDimensionSet`.
