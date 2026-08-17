# Changes — 3ERP Bracket Plate Session

## Modified: `references/sketch/dimension.md`

Added "Practical Patterns" section with three confirmed workflow patterns from the bracket plate reproduction:

```diff
+## Practical Patterns
+
+### Distance Between Circle Centers
+
+HORIZONTAL_DISTANCE and VERTICAL_DISTANCE with 2 geomIds require both to be **points**. To dimension the distance between two circle centers, extract center point IDs first:
+
+```js
+const centerA = (await api.v1.sketch.getPoints({ id: circleA })).result.centerId
+const centerB = (await api.v1.sketch.getPoints({ id: circleB })).result.centerId
+await api.v1.sketch.dimension({
+  id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [centerA, centerB]
+})
+```
+
+This also works for mixing circle centers with line endpoints (from `getPoints` on a line → `startId`/`endId`).
+
+### ANGLE Between Non-Intersecting Lines
+
+ANGLE does **not** require lines to intersect — only that they are non-parallel and distinct. The solver extends both lines to find their virtual intersection and measures the angle there. Confirmed working with lines in completely different parts of the sketch (e.g., a bottom tangent line and a distant arm wall).
+
+### OFFSET Between Parallel Non-Intersecting Lines
+
+OFFSET with 2 parallel lines measures the perpendicular distance between them, even if the lines don't share endpoints or overlap in projection. Useful for measuring arm/slot widths defined by two offset parallel walls.
```
