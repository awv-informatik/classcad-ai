# Skill Changes — common.requestVisualisation

## New File: `references/common/requestVisualisation.md`

```diff
+# common.requestVisualisation
+
+Requests tessellated rendering data (meshes, edges, curves) for specific geometry objects.
+The primary way to read back appearance properties, bounding boxes, mesh data, and faceting parameters.
+
+## Key findings:
+- Only solid IDs and shape IDs work — feature/part/sketch/work geometry IDs return null graphic
+- Negative IDs HANG the server (100% CPU, kill -9 required)
+- Container type 1 = solid (meshes, edges, vertices), type 2 = curve (arcs or edges)
+- opacity = 1 - transparency (they are inverses, not the same value)
+- Faceting parameters affect returned mesh resolution (147 to 131,845 vertices)
+- Both container.id and container.owner work as input IDs
+- Live data — reflects current state after booleans, consumed IDs become invalid
```

## Updated: `references/common/setAppearance.md`

```diff
-- **Transparency vs opacity naming** — `setAppearance` takes `transparency` (0=opaque, 1=transparent) but `requestVisualisation` returns `opacity` (0.5 transparency → 0.5 opacity). The sense is the same — `transparency` = `opacity`.
+- **Transparency vs opacity are inverses** — `setAppearance` takes `transparency` (0=opaque, 1=transparent) but `requestVisualisation` returns `opacity` (0=transparent, 1=opaque). They are **inverses**: transparency 0.3 → opacity 0.7. Formula: `opacity = 1 - transparency`.
```

**Correction:** The previous setAppearance doc incorrectly stated transparency = opacity. Testing with transparency 0.3 showed opacity 0.7, confirming they are inverses. The 0.5 case used in the original test was misleading because 1-0.5 = 0.5.
