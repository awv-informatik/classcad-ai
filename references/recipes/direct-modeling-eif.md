# Recipe: Direct modeling with solid.* inside an Entity Injection Feature (EIF)

For programmatic, non-parametric construction (imported logic, generated geometry,
one-shot builds) use the **solid API inside an entity injection feature** — not a
long feature tree you never intend to edit. The result is one clean feature in the
tree, like Onshape custom features do it.

## Operation order — the rule that shapes everything

**The EIF is a feature and can only consume features created BEFORE it** in the
operation sequence. Structure a direct build as:

```
1. part.entityInjection            ← create the EIF FIRST
2. curve.* shapes                  ← profiles, built INSIDE the EIF context
3. solid.* operations              ← revolve/extrude the shapes, then booleans, step by step
```

Do **not** create sketches after the EIF and try to feed them in — a sketch at
operation position 44 does not exist for an EIF at position 28. Inside an EIF the
idiomatic profile source is the **curve API** (`curve.shape` +
`curve.polyline2d`/`curve.advancedPolyline`), not the sketch API. Sketches are for
parametric feature modeling; curves are for direct modeling
([solid/curves-parameter](../solid/curves-parameter.md)).

## Profiles: one polyline with bulges, not line/arc chains

Build a closed profile as **one `curve.polyline2d` with signed bulge values** per
segment:

- `bulge = tan(sweepAngle / 4)`, positive = CCW arc, 0 = straight segment.
- Do NOT assemble profiles from individual `curve.line` + `curve.arcByCenter` calls:
  in chains the kernel re-picks arc branches and ignores the clockwise flag —
  profiles come out self-intersecting ([curve/arcByCenter](../curve/arcByCenter.md)).
- Orient profiles with the shape rotation/transform (e.g. rotate an XY profile by
  `[Math.PI/2, 0, 0]` to stand it in XZ for a revolve about +Z).

## Instancing without a pattern feature

Direct flows repeat a shape by extruding it N times with a rotation transform
(`rotation: [0, 0, k * 2*Math.PI / N]` on each extrusion), then subtracting each —
or subtracting a merged set. Sequential single subtractions are robust and give
per-step error localization:

```
blank revolve → subtract teeth → subtract bore → subtract keyway → subtract screw holes → …
```

## The recalc trap

**Never call `common.recalc` in a direct/EIF flow** — it destroys the injected
bodies (mass properties go null afterwards). The solid ops maintain their own state;
just keep operating and read results directly
([solid/subtraction](../solid/subtraction.md)).

## Verify

`part.calculateMassProperties` after the final op (volume, COG), plus one or two
geometry probes — [recipes/verify-numerically](verify-numerically.md). If mass
properties return null on a body that existed a step earlier, a recalc (or a
degenerate boolean) destroyed it.

## When to prefer this over the feature tree

| Situation | Use |
|---|---|
| Model should regenerate on parameter change | feature tree + expressions → [recipes/parametric-part](parametric-part.md) |
| Generated one-shot geometry, imported/computed shapes | EIF + solid.* (this recipe) |
| User will edit features interactively later | feature tree |

## Related

[part/entityInjection](../part/entityInjection.md) ·
[solid/curves-parameter](../solid/curves-parameter.md) ·
[solid/target-tools-pattern](../solid/target-tools-pattern.md) ·
[solid/subtraction](../solid/subtraction.md)
