# Changes — part.updateExtrusion training

## New file: `references/part/updateExtrusion.md`

Complete LLM doc for `part.updateExtrusion` covering:
- Open/close gate pattern
- All parameters (id, name, references, type, limit1, limit2, direction, taperAngle, capEnds)
- Return value (feature ID, not VOID)
- Behavior: multi-update sessions, parameter persistence, expression support, profile swap
- Gotchas: taper + non-normal direction, limit2=0 degenerate, capEnds type, name scope
- Common error codes and messages
- Working example

## Updated file: `references/part/extrusion.md`

```diff
+- **Taper + non-normal custom direction fails.** With CUSTOM type, taperAngle only works when the direction is perpendicular to the sketch plane. A diagonal direction like `[1,0,2]` with taperAngle > 0 errors: "Extrudedirection with taper angle is not normal to curves."
+- **Multiple regions = multiple bodies.** Passing multiple sketch region IDs in `references` creates multiple independent bodies from one feature.
```

Updated Related section to link to new `updateExtrusion.md`.
