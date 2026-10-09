# part.chamfer

Creates a chamfer feature (angled flat face) on brep edges of a part.

## Key Parameters

- `id` — **part ID** (not feature ID)
- `references` — array of brep edge IDs (from `part.getGeometryIds` or the graphic payload). One feature covers all edges; corner transitions between adjacent chamfered edges are automatic.
- `type` — `"EQUAL_DISTANCE"` (default), `"TWO_DISTANCES"`, `"DISTANCE_ANGLE"`
- `distance1` — default=2, used by all types. Accepts `@expr.NAME`.
- `distance2` — TWO_DISTANCES only (default=2). Accepts expressions.
- `angle` — DISTANCE_ANGLE only, radians (default=C:PI/4). Accepts strings like `'C:PI/6'`.

| Type | Behavior |
|---|---|
| `EQUAL_DISTANCE` | Symmetric 45° cut; `distance1` on both adjacent faces |
| `TWO_DISTANCES` | Asymmetric; `distance1` / `distance2` per adjacent face |
| `DISTANCE_ANGLE` | `distance1` on one face, `angle` sets the slope |

## Return Value

Chamfer **feature ID** (numeric) — used for `updateChamfer` and `openFeature`/`closeFeature`.

## Gotchas

- **Edge IDs from `getGeometryIds` work right away** — no `recalc()` needed (TWO_DISTANCES on ids queried directly after `part.box`: volume drop exact). `"An element of parameter 'references' has an invalid id!"` means a stale id — re-query after geometry changes.
- **Edge ids from the graphic payload work directly as `references`**: filter `api.graphic()` container `edges[]` by their `points` coordinates (e.g. all points at max z → top rim) and pass the matching `edge.id`s. They are the brep ids (`getGeometryIds` returns the same numbers): a feature renumbers the edges it changes and a recalc renumbers all — use them in the SAME session state you read them from, don't store them across recalcs/features.
- **An interrupted rim is several edges — collect ALL of them.** A plain bore rim is one closed edge, but where another cut interrupts it (a keyway, a cross hole) the rim is split into several edges. A single-position `getGeometryIds` lookup returns ONE of them → the chamfer silently covers only that sector (sprocket bore with keyway: chamfering 2 of the rim's 4 edges left a visible unchamfered sector). Sweep several azimuths around the rim, verify each candidate via `getGeometryPositions` (radius + axial position), pass all arcs in one call, then verify by probing the chamfer's outer edge (radius + distance1) at multiple azimuths. Neither maxLevel (31, success) nor volume checks catch a partial rim chamfer.
- **Oversized distance → degenerate feature.** Non-null result but `maxLevel=51`, `"Chamfer could not be applied to all edges."`; the feature stays in the tree with broken geometry. Always check `maxLevel >= 51`.
- **maxLevel 31 does not prove the chamfer happened.** On a box with a corner bore, one chamfer over the top loop including the bore's rim arc returned 31 with no messages and renumbered `part.solids` — but the volume did not change. Compare `calculateMassProperties` before and after every chamfer.
- **The chamfer renumbers the edges it changes** — re-query (`getGeometryIds`) before referencing edges of the chamfered geometry.
- **Default distance1=2 is barely visible** on 50–100mm parts; use 5–15.

## updateChamfer

`openFeature` → `updateChamfer` → `closeFeature`, with the **chamfer feature ID**. Updatable:
- `distance1`, `distance2`, `angle` — accept `@expr.NAME`; bindings can be added post-creation and reverted to numbers.
- `type` — switch freely. Missing type-specific params take creation defaults (`distance2=2`, `angle=C:PI/4`); existing `distance1` is preserved.
- `references` — edge IDs from the current geometry
- `name`

Gotchas:
- **Without `openFeature`:** result=null, maxLevel=51, code 1200 "The provided feature is not allowed to update. It's not active and open."
- **Oversized update** gives the same `maxLevel=51` / "Chamfer could not be applied to all edges." — check maxLevel.
- **Rescue:** open a failed chamfer and update to a valid distance → maxLevel back to 31; no delete/recreate needed.
- Type-irrelevant params (e.g. `distance2`/`angle` on EQUAL_DISTANCE) are silently ignored (maxLevel=31).
- Repeated open→update→close cycles are fine.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'ChamferDemo' })).result
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

const edgeIds = (await api.v1.part.getGeometryIds({
  id: partId,
  lines: [{ pos: [40, 0, 40] }, { pos: [80, 30, 40] }], // top-front, top-right edge midpoints
})).result.lines

const chamferId = (await api.v1.part.chamfer({
  id: partId, name: 'TopChamfer', references: edgeIds, type: 'EQUAL_DISTANCE', distance1: 10,
})).result

await api.v1.part.openFeature({ id: chamferId })
await api.v1.part.updateChamfer({ id: chamferId, type: 'TWO_DISTANCES', distance1: 5, distance2: 15 })
await api.v1.part.closeFeature({ id: chamferId })
```

## Related

`part.fillet` · `part.updateChamfer` · `part.getGeometryIds` · `part.openFeature` / `part.closeFeature`
