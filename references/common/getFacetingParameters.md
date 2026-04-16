# common.getFacetingParameters

Returns the current tessellation parameters: `angleTol` and `chordHeightTol`. No parameters required. This is a convenience accessor — the same values are available (alongside 6 other fields) via `getDatabaseSettings`.

## Return Value

```js
{
  result: { angleTol: real, chordHeightTol: real },
  messages: [],
  maxLevel: 31
}
```

Always returns exactly two fields. No extra properties.

## Defaults

| Field | Default | Meaning |
|---|---|---|
| `angleTol` | 0 | Max angle (degrees) between adjacent tessellation surfaces. 0 = disabled. |
| `chordHeightTol` | 0.1 | Max distance between geometry and tessellated arc. Lower = finer mesh. |

## Relationship to getDatabaseSettings

Same backing store. `getFacetingParameters` returns 2 fields, `getDatabaseSettings` returns all 8 (including `facetingParamsMode`, `doCurveTessellation`, etc.). Changes via `setFacetingParameters` or `setDatabaseSettings` are visible from both getters.

## Working Example

```js
const fp = (await api.v1.common.getFacetingParameters()).result
// fp = { angleTol: 0, chordHeightTol: 0.1 }
```

## Related

- `common.setFacetingParameters` — write counterpart (requires both params)
- `common.getDatabaseSettings` — superset that includes facetingParamsMode and other fields
