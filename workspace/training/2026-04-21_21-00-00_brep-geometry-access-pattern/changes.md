# Changes

## New file: `references/part/brep-access-pattern.md`

```diff
+# Brep Geometry Access Pattern
+
+How to find edge and face IDs for `fillet`, `chamfer`, `workPlane`, `workAxis`, `compositeCurve`, and other APIs that take brep references. This doc ties together four APIs into a unified workflow.
+
+## The Four APIs
+
+| API | Input | Output | Use when |
+|---|---|---|---|
+| `getGeometryIds` | Part ID + positions | Brep element IDs | You know WHERE the edge/face is |
+| `getGeometryPositions` | Brep element IDs | Positions | You need to serialize/persist edge references |
+| `getBrepGeometryByIndex` | Feature ID + index | Brep element ID | You need to enumerate ALL edges of a type |
+| `getBrepGeometryIndex` | Feature ID + brep ID | Index | You need to check which feature owns an edge |
+
+## The Core Pattern
+...
+(220 lines total — full content in references/part/brep-access-pattern.md)
```

Key sections:
- The Core Pattern (recalc → find → operate → recalc → repeat)
- Two Approaches: Position-Based vs Index-Based (with strengths/weaknesses)
- Enumerate → Classify → Select Pattern
- Edge Type Rules: circles vs arcs (critical distinction)
- After Fillet/Chamfer: What Happens to Edges
- Multi-Step Sequential Pattern
- Serialization: Persisting Edge References
- Box Edge Midpoint Reference
- Common Mistakes
