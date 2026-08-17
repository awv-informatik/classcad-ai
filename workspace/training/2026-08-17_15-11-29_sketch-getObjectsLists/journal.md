# sketch.getObjectsLists — training journal

Trigger (ph): during the in-app sprocket e2e the agent's proof script did
`(await api.v1.sketch.getObjectsLists({id})).result.constraints` and result was
null — is that our bug? No trained doc existed (registry JSDoc is two lines,
no return shape).

## 01 — shape, id semantics, lifecycle (node worker, live)

- Result shape (open sketch, one of each entity kind):
  `{ arcs, circles, constraints, constructionGeometry, dimensions, lines, points, solidGeometry }`
  — all arrays of TREE ids.
- **`dimensions` returns the SOLVER constraint, not the display entity.**
  `dimension()` returned 87 (CC_RadialFeatureDimension, under
  CC_SketchDimensionSet); the list contained 85 = CC_2DDiameterConstraint (the
  `master`, child of the sketch). Anyone joining `dimension()` results against
  this list gets zero matches.
- `constraints` includes ALL autos (Auto_Fix, Auto_H, Auto_Coinc) + explicit ones.
- `constructionGeometry` is a subset view (ids also appear in circles/lines/arcs).
- `solidGeometry` = profile-capable curves (line, circle, arc — no construction,
  no points). Useful as extrusion `references` candidates.
- `points` includes every start/end/center point (named startPoint/endPoint/center).
- Lifecycle: works UNCHANGED after the sketch is consumed by an extrusion (31).
- Wrong ids fail CLEANLY: part id → 51 'wrong id type! Provide only ["sketch"]';
  bogus id → 51 'ToId() didn't get an existing or valid id.' — result null in
  both, so `.result.constraints` on a wrong-id call is exactly the observed crash.
- OPEN: in the buerligons run (npm-shipped WASM build) the call returned result
  null on a valid sketch id — not reproducible on the current native worker
  (Jul 13). Engine-version variance suspected; re-probe in the next browser e2e.
  Robust fallback either way: the tree scan per STRUCTURE.md (constraints =
  *Constraint children of CC_Sketch; display dims under CC_DimensionSet ›
  CC_SketchDimensionSet, master → solver constraint).
