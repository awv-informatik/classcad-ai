# Format Comparison — OFB vs STP vs STL vs SCG vs IWP vs DXF

## Quick Decision Table

| Goal | Format | Why |
|---|---|---|
| Save & reload (full fidelity) | OFB + deflate + base64 | Only format preserving IDs, expressions, features; smallest full-fidelity |
| CAD interchange | STP (AP214) + base64 | Standard B-rep, universally readable, geometry-perfect |
| Mesh export (3D printing, viz) | STL + base64 | Set `stl.facetingTol` for curved surfaces |
| Smallest / minimal wire transfer | OFB+deflate (parametric) or STL (flat geometry) | |
| 2D export | — | DXF not available on this worker (`drawing2d.isDXFAvailable()` returns 0; classcad-cli: `CADH_GetDxfTemplateFile not found`) |
| Never for round trip | SCG (export-only), DXF | |

## Format Capabilities

| Format | Save | Load | IDs | Expressions | Features | Assembly |
|---|---|---|---|---|---|---|
| OFB | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| STP | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| IWP | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| SCG | ✅ | ❌ | — | — | — | ✅ |
| STL | ✅ | ❌ | — | — | — | ❌ |
| DXF | ❌ | ❌ | — | — | — | — |

**IWP load works for solids** (box round trip: volume exact); IDs and expressions are not preserved. Prefer STP for interchange with other tools.

## Size Comparison

80×60×40 box, base64:

| Format | b64 chars | Relative |
|---|---|---|
| OFB + deflate + base64 | ~5,700 | **1x** |
| STP | ~13,000 | 2.3x |
| SCG | ~19,500 | 3.4x |
| IWP binary | ~22,400 | 3.9x |
| OFB (no compression) | ~44,000 | 7.7x |
| IWP ASCII | ~48,700 | 8.5x |
| STL (flat geometry) | ~900 | 0.16x |

### STL size sensitivity

| Geometry | STL b64 chars |
|---|---|
| Box (flat-faced) | 912 |
| Sphere+cylinder boolean (default tol) | 255,980 |
| Same, facetingTol=1.0 | 50,380 |
| Same, facetingTol=0.01 | 3,670,248 |

`facetingTol` dominates (73× between 1.0 and 0.01); `angleTol` is modest (1.6× between 30° and 1°). For curved geometry **always specify facetingTol**.

### Multi-body scaling (5 bodies vs 1)

OFB+deflate 2.3x (best — compression improves with repetition) · OFB raw 3.1x · SCG 3.7x · STP 3.8x · IWP binary 4.0x · IWP ASCII 4.2x · STL 39.6x (curved bodies).

## Encoding Rules

All formats support `encoding: 'base64'` and `compression: 'deflate'`:

- **STL MUST use base64** — binary STL is truncated to 32 chars (header only) in JSON.
- **IWP and SCG should use base64** — raw binary is partially corrupted in JSON strings.
- **OFB and STP work raw** (text), but deflate+base64 is still recommended.
- **Never deflate without base64.** Pipeline: save → deflate → base64; load → base64-decode → inflate (`encoding-pipeline.md`).

Deflate+base64 vs base64 only (80×60×40 box): IWP ASCII 92%, OFB 87%, SCG 85%, STP 77%, STL 75%.

## STP Versions

AP203 (v1), AP214 (v2, default — use it), AP242 (v3). Size differences <2%; `asPart: 1` gives ~1% more reduction. All versions produce maxLevel 51 with an informational message (not an error).

## Round-trip Fidelity

- **OFB — full:** IDs (same values), expressions (names, values, formulas like `width * 0.5`), feature tree, geometry. **Potential limitation:** `@expr.` bindings to feature parameters may not fully survive — values are preserved, but updating an expression after round trip may not propagate to the bound feature (needs further investigation).
- **STP — geometry only:** IDs change completely (4 → 11), expressions gone (value=null), feature history gone; geometry perfectly preserved (STL byte-identical before/after). Use `loaded.result.id` as the new root and rediscover other IDs.
- **IWP — geometry only:** IDs change, expressions gone, solid geometry restored (box: volume exact).
- **SCG — export only:** load rejects it with 1013 (valid: OFB, STP, IWP). Stores mesh visualization data, so it explodes for curved geometry (sphere 13× a box, vs 1.2× for STP).
- **DXF — broken** in classcad-cli for all geometry (2D curves/sketches and 3D solids): missing template file in the deployment, not a geometry limitation.
