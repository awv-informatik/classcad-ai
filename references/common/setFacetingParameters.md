# common.setFacetingParameters

Sets the tessellation parameters (`angleTol` and `chordHeightTol`) for the current drawing. **Both parameters are required** — omitting either causes a NullMem error.

## Prerequisites

None — works on any drawing state, even empty.

## Key Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| `angleTol` | real | **YES** | Max angle (degrees) between adjacent tessellation surfaces. 0 = disabled. Must be 0 or >= 1.0. |
| `chordHeightTol` | real | **YES** | Max distance between geometry and tessellated arc. Must be > 0 (unless angleTol > 0, then 0 is accepted). |

**Both params must be provided in every call.** This is NOT a partial-update API — unlike `setDatabaseSettings`, you cannot set just one field.

## Return Value

Returns null (VOID). maxLevel=31 on success, maxLevel=51 on error.

## Validation Rules

| Input | Behavior |
|---|---|
| Both params, valid values | ✅ Applied (maxLevel=31) |
| Only one param provided | ❌ NullMem error (maxLevel=51) |
| `{}` (empty) | ❌ Error (maxLevel=51) |
| `angleTol` in (0, 1) exclusive | ❌ Rejected (maxLevel=51). Must be 0 or >= 1.0 |
| `chordHeightTol: 0` with `angleTol > 0` | ✅ Accepted |
| Both zero | ❌ "Not allowed to set both angleTol and chordHeightTol to 0" |
| Negative values | ⚠️ Silently ignored — maxLevel=31 but value unchanged |
| Very large values (1000, 360) | ✅ Accepted and stored |
| Wrong type (string) | ❌ Code 1001 "wrong type! should be (real)" |
| Unknown param names | ❌ Error (maxLevel=51) — NullMem because required params missing |

## Differences from setDatabaseSettings

| Behavior | setFacetingParameters | setDatabaseSettings |
|---|---|---|
| Partial updates | ❌ Both params required | ✅ Omitted fields untouched |
| Empty `{}` | ❌ Error (maxLevel=51) | ✅ No-op (maxLevel=31) |
| `chordHeightTol: 0` | ✅ Accepted (if angleTol > 0) | ❌ Error (maxLevel=51) |
| Unknown params | ❌ Error | ✅ Silently ignored |
| Scope | Only angleTol + chordHeightTol | All 8 database settings |

## Cross-talk

Both APIs share the same backing store for `angleTol` and `chordHeightTol`. Changes via one are visible from the other:

```js
await api.v1.common.setFacetingParameters({ angleTol: 20, chordHeightTol: 0.05 })
const db = (await api.v1.common.getDatabaseSettings()).result
// db.angleTol === 20, db.chordHeightTol === 0.05

await api.v1.common.setDatabaseSettings({ angleTol: 5, chordHeightTol: 0.8 })
const fp = (await api.v1.common.getFacetingParameters()).result
// fp.angleTol === 5, fp.chordHeightTol === 0.8
```

`setFacetingParameters` does NOT modify `facetingParamsMode` or any other database setting — only the two faceting values.

## Persistence

Worker-level state. Survives `common.clear()` and `part.create()`. NOT saved to OFB files.

## Gotchas

- **Both params are mandatory** despite the API docs marking them as optional (`[param.angleTol]`). Omitting either triggers an internal NullMem error.
- **angleTol minimum is 1.0 degree** (when non-zero). Values like 0.5 are rejected. Use 0 to disable.
- **Negative values are silently swallowed** — no error, no change. Always verify with `getFacetingParameters` after setting.
- **Zero chordHeightTol is valid here** but invalid in `setDatabaseSettings`. The two APIs have inconsistent validation for this edge case.
- Use `setDatabaseSettings` instead if you want partial updates or need to set `facetingParamsMode`.

## Working Example

```js
// Set both params (required)
await api.v1.common.setFacetingParameters({ angleTol: 5, chordHeightTol: 0.05 })

// Verify
const fp = (await api.v1.common.getFacetingParameters()).result
// fp = { angleTol: 5, chordHeightTol: 0.05 }
```

## Related

- `common.getFacetingParameters` — read counterpart
- `common.getDatabaseSettings` / `common.setDatabaseSettings` — superset API for all 8 settings (supports partial updates)
- `common.setAppearance` — per-entity tessellation overrides (when facetingParamsMode=1)
