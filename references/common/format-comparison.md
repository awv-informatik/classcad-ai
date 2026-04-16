# Format Comparison — OFB vs STP vs STL vs SCG vs IWP vs DXF

Which format to use depends on your goal: full-fidelity persistence, cross-system interchange, visualization, or minimal size.

## Quick Decision Table

| Goal | Format | Why |
|---|---|---|
| Save & reload (full fidelity) | OFB + deflate + base64 | Only format that preserves IDs, expressions, features |
| CAD interchange | STP (AP214) | Standard B-rep format, universally readable |
| Mesh export (3D printing, viz) | STL + base64 | Triangle mesh, configure faceting for curved surfaces |
| Smallest possible | STL (flat) or OFB+deflate (parametric) | Depends on whether you need parametrics |
| 2D export | — | DXF is broken in classcad-cli. No 2D export available. |

## Format Capabilities

| Format | Save | Load | Preserves IDs | Preserves Expressions | Preserves Features | Assembly |
|---|---|---|---|---|---|---|
| OFB | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| STP | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| IWP | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| SCG | ✅ | ❌ | — | — | — | ✅ |
| STL | ✅ | ❌ | — | — | — | ❌ |
| DXF | ❌ | ❌ | — | — | — | — |

**⚠️ IWP load is unreliable.** Loads without error but may not produce renderable solid geometry. Prefer STP for interchange.

## Size Comparison

Measured on an 80x60x40 box, all base64-encoded:

| Format | b64 chars | Relative |
|---|---|---|
| OFB + deflate + base64 | ~5,700 | **1x** (baseline) |
| STP + base64 | ~13,000 | 2.3x |
| SCG + base64 | ~19,500 | 3.4x |
| IWP binary + base64 | ~22,400 | 3.9x |
| OFB + base64 (no compression) | ~44,000 | 7.7x |
| IWP ASCII + base64 | ~48,700 | 8.5x |
| STL + base64 (flat geometry) | ~900 | 0.16x |

**Key insight:** OFB+deflate is the best overall option — smallest full-fidelity format. STP is the best interchange format. STL is tiny for flat geometry but explodes for curved surfaces.

## STL Size Sensitivity

STL stores triangle meshes, so curved surfaces dramatically increase size:

| Geometry | STL b64 chars |
|---|---|
| Box (flat-faced) | 912 |
| Sphere+cylinder boolean (default tol) | 255,980 |
| Same, facetingTol=1.0 (coarse) | 50,380 |
| Same, facetingTol=0.01 (fine) | 3,670,248 |

- `facetingTol` has the dominant effect — 73x range between 1.0 and 0.01
- `angleTol` has modest effect — 1.6x between 30° and 1°
- For curved geometry: **always specify facetingTol** to control output size

## Encoding Rules

All formats support `encoding: 'base64'` and `compression: 'deflate'`. But:

- **STL MUST use base64.** Binary STL data is truncated to 32 chars in JSON transport. Only the header survives.
- **IWP and SCG should use base64.** Raw binary data is partially corrupted in JSON strings.
- **OFB and STP work raw** — they're text-based. But deflate+base64 is still recommended (83% smaller for OFB, 69% for STP).
- **Always use deflate+base64 together.** Never deflate without base64 — the compressed binary data is garbled in JSON. Pipeline: save → deflate → base64, load → base64-decode → inflate.

Compression effectiveness:

| Format | Compression ratio (deflate+b64 vs raw) |
|---|---|
| IWP | 90% reduction (best) |
| OFB | 83% |
| SCG | 80% |
| STP | 69% |

## STP Version Differences

Three versions: AP203 (v1), AP214 (v2, default), AP242 (v3).

- Size differences: <2% across all versions
- `asPart: 1` provides ~1% additional reduction
- All versions produce maxLevel=51 with an informational message (not an error)
- **Use the default AP214 (v2).** No practical reason to switch.

## Roundtrip Fidelity

### OFB — Full Fidelity
- IDs preserved (same numeric values)
- Expressions preserved (names, values, formulas like `width * 0.5`)
- Feature tree structure preserved
- Geometry preserved
- **Potential limitation:** `@expr.` bindings to feature parameters may not fully survive roundtrip. Expression values are preserved, but updating an expression after roundtrip may not propagate to the bound feature. This needs further investigation.

### STP — Geometry Only
- IDs change completely (was 4, now 11)
- Expressions gone (value=null after load)
- Feature history gone
- **Geometry perfectly preserved** — STL byte-for-byte identical before/after roundtrip
- Use `loaded.result.id` as the new root, re-discover other IDs

### IWP — Unreliable
- IDs change
- Expressions gone
- Geometry may not be renderable (no solid content after load in testing)
- **Avoid for roundtrip.** Use STP instead.

## SCG — Export Only

SCG (ClassCAD Scene Graph) saves successfully but cannot be loaded. The `load` API rejects it with code 1013: valid formats are OFB, STP, IWP only. SCG stores mesh visualization data — it explodes in size for curved geometry (13x a box for a sphere, vs 1.2x for STP).

## DXF — Broken

DXF is completely non-functional in classcad-cli. Error: `CADH_GetDxfTemplateFile not found`. This affects **all geometry types** — both 2D curves/sketches and 3D solids fail with the same error. The issue is a missing template file in the deployment, not a geometry limitation.

## Multi-Body Scaling

All formats scale roughly linearly with body count. For 5 bodies vs 1:

| Format | Growth factor |
|---|---|
| OFB+deflate | 2.3x (best) |
| OFB raw | 3.1x |
| SCG | 3.7x |
| STP | 3.8x |
| IWP binary | 4.0x |
| IWP ASCII | 4.2x |
| STL | 39.6x (if bodies have curved surfaces) |

OFB+deflate scales best because compression improves with more repetitive data. STL scales worst when bodies include curved surfaces.

## Practical Recommendations

1. **For save/load cycles:** `OFB` + `encoding: 'base64'` + `compression: 'deflate'`. Smallest, full fidelity.
2. **For CAD interchange:** `STP` + `encoding: 'base64'`. Universal, geometry-perfect.
3. **For mesh/viz export:** `STL` + `encoding: 'base64'`. Set `stl.facetingTol` for curved surfaces.
4. **For minimal wire transfer:** OFB+deflate for parametric models, STL for flat geometry.
5. **Never use:** DXF (broken), SCG for roundtrip (export-only), IWP for roundtrip (unreliable).
