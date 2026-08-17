# Changes — Format Comparison Training

## New file: `references/common/format-comparison.md`

```diff
+# Format Comparison — OFB vs STP vs STL vs SCG vs IWP vs DXF
+
+Which format to use depends on your goal: full-fidelity persistence, cross-system interchange, visualization, or minimal size.
+
+## Quick Decision Table
+
+| Goal | Format | Why |
+|---|---|---|
+| Save & reload (full fidelity) | OFB + deflate + base64 | Only format that preserves IDs, expressions, features |
+| CAD interchange | STP (AP214) | Standard B-rep format, universally readable |
+| Mesh export (3D printing, viz) | STL + base64 | Triangle mesh, configure faceting for curved surfaces |
+| Smallest possible | STL (flat) or OFB+deflate (parametric) | Depends on whether you need parametrics |
+| 2D export | — | DXF is broken in classcad-cli. No 2D export available. |
+
+[... 138 lines total — full format comparison with capabilities table, size benchmarks,
+     STL size sensitivity, encoding rules, STP version differences, roundtrip fidelity
+     for OFB/STP/IWP, SCG export-only confirmation, DXF broken status, multi-body scaling,
+     and practical recommendations]
```

## Updated: `references/common/save.md`

```diff
 - `common.recalc` — recalculate after loading
+- `format-comparison.md` — detailed format comparison with size benchmarks and roundtrip fidelity
```

## Updated: `references/common/load.md`

```diff
 - `common.recalc` — recalculate the drawing (not needed after basic load)
+- `format-comparison.md` — detailed format comparison with size benchmarks and roundtrip fidelity
```
