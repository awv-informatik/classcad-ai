# Changes — updateWorkCSys training session

## New file: `references/part/updateWorkCSys.md` (+88 lines)

```diff
+# part.updateWorkCSys
+
+Key findings:
+
++ openFeature/closeFeature mandatory
++ offset, rotation, inverted all updateable
++ Type change to XYAXISORIGIN without refs silently succeeds (differs from updateWorkAxis)
++ Built-in Origin: different error messages, rename-despite-error quirk persists
++ No-op update harmless (maxLevel 31)
++ Can update references without re-specifying type
++ Multiple updates in one session work
++ 4 common errors documented
```
