# Changes — workCSys training session

## New file: `references/part/workCSys.md` (+100 lines)

```diff
+# part.workCSys
+
+Key findings:
+
++ 2 types: CUSTOM (free-standing) and XYAXISORIGIN (3 refs: origin + 2 axes)
++ offset = [x,y,z] translation vector, rotation = [rx,ry,rz] Euler angles in radians
++ inverted mirrors X-axis
++ Expression strings in offset/rotation fail (numbers only) — same as workAxis
++ XYAXISORIGIN requires exactly 3 refs, accepts brep + work geometry
++ offset/rotation apply on top of referenced frame for XYAXISORIGIN
++ Built-in: "Origin" (ID 22) — one per part
++ Duplicate names silently allowed
++ 4 common errors with causes and fixes
++ Working examples for CUSTOM, XYAXISORIGIN, and inverted
```
