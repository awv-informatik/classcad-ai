# common.setFacetingParameters

Sets the global tessellation parameters `angleTol` and `chordHeightTol`. Works in any drawing state, even empty.

## Key Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| `angleTol` | real | **YES** | Max angle (degrees) between adjacent tessellation surfaces. 0 = disabled. Must be 0 or >= 1.0. |
| `chordHeightTol` | real | **YES** | Max distance between geometry and tessellated arc. Must be > 0 (0 accepted if angleTol > 0). |

**Both are required in every call**, although the API docs mark them optional (`[param.angleTol]`) — omitting either gives an internal NullMem error. Not a partial update; use `setDatabaseSettings` for partial updates or to set `facetingParamsMode`.

## Return Value

null (VOID). maxLevel 31 on success, 51 on error.

## Validation Rules

| Input | Behavior |
|---|---|
| Both params, valid values | ✅ Applied (maxLevel 31) |
| Only one param | ❌ NullMem error (51) |
| `{}` | ❌ Error (51) |
| `angleTol` in (0, 1) exclusive, e.g. 0.5 | ❌ Rejected (51) — use 0 to disable |
| `chordHeightTol: 0` with `angleTol > 0` | ✅ Accepted |
| Both zero | ❌ "Not allowed to set both angleTol and chordHeightTol to 0" |
| Negative values | ⚠️ Silently ignored — maxLevel 31, value unchanged. Verify with `getFacetingParameters`. |
| Very large values (1000, 360) | ✅ Stored |
| Wrong type (string) | ❌ Code 1001 "wrong type! should be (real)" |
| Unknown params without the valid ones | ❌ NullMem — required params missing |
| Unknown params with valid ones (e.g. `facetingParamsMode`) | ✅ Ignored, no effect; values applied |

## Differences from setDatabaseSettings

| Behavior | setFacetingParameters | setDatabaseSettings |
|---|---|---|
| Partial updates | ❌ Both required | ✅ Omitted fields untouched |
| Empty `{}` | ❌ Error (51) | ✅ No-op (31) |
| `chordHeightTol: 0` | ✅ If angleTol > 0 | ❌ Error (51) |
| Unknown params alone | ❌ Error | ✅ Ignored |
| Scope | angleTol + chordHeightTol | All 8 database settings |

Both share the backing store for `angleTol`/`chordHeightTol` — changes via either show in `getDatabaseSettings` and `getFacetingParameters`. `setFacetingParameters` does NOT modify `facetingParamsMode` or any other setting.

## Persistence

Worker-level state: survives `common.clear()` and `part.create()`. NOT saved to OFB files.

## Working Example

```js
const before = (await api.v1.common.getFacetingParameters()).result

await api.v1.common.setFacetingParameters({ angleTol: 5, chordHeightTol: 0.05 })
const fp = (await api.v1.common.getFacetingParameters()).result
// fp = { angleTol: 5, chordHeightTol: 0.05 }

// Worker-global — restore
await api.v1.common.setFacetingParameters(before)
```

## Related

`common.getFacetingParameters` · `common.getDatabaseSettings` / `common.setDatabaseSettings` · `common.setAppearance`
