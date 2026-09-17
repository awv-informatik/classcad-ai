# part.updateMirror

Updates an existing mirror feature's name, targets, or plane. Must be wrapped in `part.openFeature` / `part.closeFeature`; geometry regenerates on `closeFeature`, not during `updateMirror`.

## Key Parameters

- `id` — **mirror feature ID** (from `part.mirror`, not the part ID)
- `name` — optional
- `targets` — optional. **Full replacement** — `targets: [newId]` drops all previous targets; to add one, pass all existing plus the new. Flat `[id1, id2]` and object `[{ id: id1 }, { id: id2 }]` both work.
- `references` — optional new mirror plane (same accepted kinds as `mirror`); built-in (`Top`/`Front`/`Right`) and custom (`USERDEFINED`) work planes both work

Omitted params keep their values. Only `id` is a valid no-op (returns feature ID, maxLevel=31, geometry unchanged).

## Return Value

Mirror feature ID (maxLevel=31, messages=[]). null on failure (maxLevel=51).

## Common Errors

| Code | Message | Cause | Fix |
|------|---------|-------|-----|
| 1200 | "The provided feature is not allowed to update. It's not active and open." | Missing `openFeature` (returns null) | Call `openFeature({ id: mirrorId })` first |
| 1004 | '"id" must be provided for update.' | Follows error 1200 | Fix the openFeature issue |
| 1006 | "An element of parameter 'references' has an invalid id!" | Invalid reference ID | Use a valid work plane ID |
| 1006 | "An element of parameter 'targets' has an invalid id!" | Invalid target ID | Verify feature IDs |
| 1111 | "There is no reference found for Mirror (CC_Mirror)." | Empty references `[]` | Provide at least one work plane ID |
| 1004 | "The type '0' is not supported in PrepareAPIParams!" | Empty targets `[]` | Provide at least one target |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MirrorUpd' })).result
const wcs1 = (await api.v1.part.workCSys({ id: partId, name: 'WCS1', offset: [20, 10, 0] })).result
const wcs2 = (await api.v1.part.workCSys({ id: partId, name: 'WCS2', offset: [20, 60, 0] })).result
const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 30, width: 25, height: 40, references: [wcs1] })).result
const box2 = (await api.v1.part.box({ id: partId, name: 'Box2', length: 20, width: 20, height: 20, references: [wcs2] })).result
const rightWpId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result
const frontWpId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
const mirrorId = (await api.v1.part.mirror({ id: partId, targets: [box1], references: [rightWpId] })).result

// Rename + change plane Right → Front
await api.v1.part.openFeature({ id: mirrorId })
await api.v1.part.updateMirror({ id: mirrorId, name: 'MirrorFront', references: [frontWpId] })
await api.v1.part.closeFeature({ id: mirrorId })

// Add a target — pass the full list
await api.v1.part.openFeature({ id: mirrorId })
await api.v1.part.updateMirror({ id: mirrorId, targets: [box1, box2] })
await api.v1.part.closeFeature({ id: mirrorId })
```

## Related

`part.mirror` · `part.openFeature` / `part.closeFeature`
