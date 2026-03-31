# common.setObjectName

Renames any object in the drawing by its ID. Works on parts, features (entity injections, work geometry), and even internal/system objects.

## Prerequisites

- An object must exist (created via `part.create`, `part.entityInjection`, `part.workPlane`, etc.)

## Key Parameters

- `id` — ID of the object to rename. Required.
- `name` — new name string. Required. Can be any string including empty, unicode, slashes, 200+ chars.

## Return Value

- `result`: `null` (VOID) — always, even on success
- `maxLevel`: 31 on success, 51 on error

## Gotchas

### Sibling name deduplication

The server enforces unique names **per parent container**. If you rename an object to a name already held by a sibling, the server silently appends a numeric suffix: `<name>0`, `<name>1`, etc. The original name-holder keeps its name. This is silent — no warning, no error.

```js
// eif1 is named "Foo", eif2 is named "Bar" — both siblings in OperationSequence
await api.v1.common.setObjectName({ id: eif2, name: 'Foo' })
// eif2 is now "Foo0", NOT "Foo"
```

Dedup is **sibling-scoped only** — objects in different parent containers (e.g., an EIF in OperationSequence vs. Origin in ReferenceSet) can share the same name.

### Renaming breaks name-based lookups

After renaming work geometry, `getWorkGeometry` only finds it by the **new** name. The old name returns error code 1015.

```js
await api.v1.common.setObjectName({ id: wpId, name: 'NewName' })
// getWorkGeometry({ id: partId, name: 'OldName' }) → error 1015
// getWorkGeometry({ id: partId, name: 'NewName' }) → wpId ✓
```

### Default planes can be renamed

Top, Right, Front, and other built-in work geometry can be renamed. This **breaks** any code that looks up default planes by name (e.g., `getWorkGeometry({ name: 'Top' })`). Avoid renaming defaults unless intentional.

### Internal objects can be renamed

System objects like ExpressionSet, Origin, XAxis are not protected. Renaming them succeeds silently. This is dangerous — avoid unless you know what you're doing.

### Empty string is valid

`name: ''` is accepted with no error. The object will have an empty name in the structure tree. This could break name-based lookups.

### ID -1 is silently accepted

Passing `id: -1` returns maxLevel=31 (no error) but has no observable effect. IDs 0 and nonexistent positive IDs correctly return error code 1006.

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1004 | 51 | "parameter 'name' must be provided" | Missing `name` param |
| 1004 | 51 | "parameter 'id' must be provided" | Missing `id` param |
| 1006 | 51 | "invalid id!" | Nonexistent or zero ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

// Rename the feature
await api.v1.common.setObjectName({ id: eifId, name: 'MainBody' })
// result: null, maxLevel: 31 — success
```

## Related

- `part.create` — `name` param sets initial name at creation
- `part.entityInjection` — `name` param sets initial name
- `part.workPlane` / `workAxis` / `workCSys` / `workPoint` — `name` param sets initial name
- `part.getWorkGeometry` — looks up work geometry by name (affected by renames)
