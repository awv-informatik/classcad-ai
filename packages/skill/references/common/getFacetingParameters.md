# common.getFacetingParameters

Returns the current tessellation parameters. No parameters. Same backing store as `getDatabaseSettings` (which returns these 2 plus 6 more fields, incl. `facetingParamsMode`, `doCurveTessellation`); changes via `setFacetingParameters` or `setDatabaseSettings` show in both getters.

## Return Value

`result: { angleTol: real, chordHeightTol: real }` — exactly these two fields, maxLevel 31.

| Field | Default | Meaning |
|---|---|---|
| `angleTol` | 0 | Max angle (degrees) between adjacent tessellation surfaces. 0 = disabled. |
| `chordHeightTol` | 0.1 | Max distance between geometry and tessellated arc. Lower = finer mesh. |

## Working Example

```js
const fp = (await api.v1.common.getFacetingParameters()).result
// fp = { angleTol: 0, chordHeightTol: 0.1 }
```

## Related

`common.setFacetingParameters` · `common.getDatabaseSettings`
