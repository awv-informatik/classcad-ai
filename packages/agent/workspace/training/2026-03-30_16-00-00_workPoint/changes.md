# Changes — workPoint training session

## New file: `references/part/workPoint.md` (+111 lines)

```diff
+# part.workPoint
+
+Key findings:
+
++ 8 types tested: USERDEFINED, BREPVERTEX, EDGEMIDPOINT, CENTER, BARYCENTER, INTERSECTION, INNERCIRCLE, 2POINTS
++ BREPVERTEX rejects work point IDs — only sketch-point and vertex
++ BARYCENTER rejects work plane IDs — only face-plane (doc discrepancy)
++ 2POINTS with same point succeeds (unlike workAxis which errors)
++ CENTER works with sketch circles (param is centerPos not center)
++ INNERCIRCLE works with 3 sketch lines (triangle incircle)
++ No built-in work points exist
++ Expression strings in position fail (consistent)
++ Type-specific valid reference table included
```
