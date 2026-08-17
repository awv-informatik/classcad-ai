# Changes — ID System Training

## File changed

`references/common/generic.md`

## Diff

```diff
-**`id`:** Positive integers. IDs are sequential but with gaps (a part creates ~50 child objects, so the next part ID is ~50 higher). As parameters, IDs accept both numbers and string-encoded numbers (`4` and `"4"` both work). Float, negative, and zero values fail.
+**`id`:** Positive integers (`typeof === 'number'`, `Number.isInteger() === true`). IDs are monotonically increasing with variable gaps — each creation allocates internal child objects, so gaps depend on the object type (part.create consumes ~50 IDs, box ~37). As parameters, IDs accept numbers and string-encoded numbers (`4`, `"4"`, `" 4 "`, even `"4.0"` all work — the parser trims whitespace and coerces float strings). Float numbers (4.5), zero, negative, null, booleans, empty strings, and JS objects all fail. See [ID System](#id-system) for full details.

-| 1006 | Invalid ID                       | Nonexistent ID, string as ID                 |
-| 1007 | Wrong ID type                    | Part ID where feature/operation ID expected  |
+| 1006 | Invalid ID                       | Nonexistent ID, float ID, already-deleted ID |
+| 1007 | Wrong ID type                    | Part ID where feature ID expected, vice versa|

-| 1200 | Root already exists              | Second `part.create` in same drawing         |
+| 1200 | Root already exists / not editable | Second `part.create`, or `update*` on locked feature |

+## ID System (new section)
+
+Added comprehensive ID system documentation:
+- ID lifecycle (creation, consumption, deletion, clear)
+- ID validation error codes (1006 vs 1007 vs 1001) with full table
+- ID type expectations (create vs update vs common APIs)
+- Accepted ID format table (11 variants tested)
+- Object hierarchy diagram after part.create (~24 objects)
+- Structure tree format and usage
+- Batch ID referencing limitations
```
