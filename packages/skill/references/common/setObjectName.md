# common.setObjectName

Renames any object by ID — parts, features (entity injections, work geometry), even internal/system objects.

## Key Parameters

- `id` — object to rename. Required.
- `name` — new name. Required. Any string: empty, unicode, slashes, 200+ chars.

## Return Value

`result: null` (VOID), even on success. maxLevel 31 on success, 51 on error.

## Gotchas

- **Sibling name deduplication.** Names are unique **per parent container**. Renaming to a name a sibling holds silently appends a numeric suffix (`<name>0`, `<name>1`, …); the original holder keeps its name. No warning. Objects in different containers (e.g. an EIF in OperationSequence vs. Origin in ReferenceSet) can share a name.
  ```js
  // eif1 is "Foo", eif2 is "Bar" — siblings in OperationSequence
  await api.v1.common.setObjectName({ id: eif2, name: 'Foo' })  // eif2 is now "Foo0"
  ```
- **Renaming breaks name-based lookups.** `getWorkGeometry` finds renamed geometry only by the new name; the old name gives error 1015.
- **Default planes can be renamed** (Top, Right, Front, …), which breaks code like `getWorkGeometry({ name: 'Top' })`. Avoid unless intentional.
- **Internal objects are not protected.** Renaming ExpressionSet, Origin, XAxis succeeds silently — dangerous; avoid unless you know what you're doing.
- **Empty string is accepted** — the object gets an empty name, which can break name-based lookups.
- **`id: -1` is silently accepted** — maxLevel 31, no observable effect. ID 0 and nonexistent positive IDs return 1006.

## Common Errors

| Code | Level | Message | Cause |
|---|---|---|---|
| 1004 | 51 | "parameter 'name' must be provided" | Missing `name` |
| 1004 | 51 | "parameter 'id' must be provided" | Missing `id` |
| 1006 | 51 | "invalid id!" | Nonexistent or zero ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
await api.v1.common.setObjectName({ id: eifId, name: 'MainBody' })
// result: null, maxLevel: 31
```

## Related

`part.create` · `part.entityInjection` · `part.workPlane` / `workAxis` / `workCSys` / `workPoint` · `part.getWorkGeometry`
