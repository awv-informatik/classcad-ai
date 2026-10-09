# Recipe: Direct modeling with solid.\* inside an Entity Injection Feature (EIF)

For programmatic, non-parametric construction (imported logic, generated geometry,
one-shot builds) use the **solid API inside an entity injection feature** — not a
long feature tree you never intend to edit. The result is one clean feature in the
tree, like Onshape custom features do it.

**NOT for reproducing dimensioned input.** A technical drawing or dimensioned spec
is constrained-sketching territory (dimension checklist → constraints + dimensions;
the solver lays out the sketch) — this recipe's territory is geometry with no
dimension scheme to honor.

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
([solid/curves-parameter](../references/solid/curves-parameter.md)).

## Profiles: one polyline with bulges

Build a closed profile as **one `curve.polyline2d` (or `advancedPolyline`) with
signed bulge values** per segment — one call, every arc encoded by its sweep:

- `bulge = tan(sweepAngle / 4)`, 0 = straight segment.
- **Sign = side relative to +Z, not to the winding:** positive = counterclockwise
  seen from +Z = the arc bulges **right of the travel direction**. Walk the outline
  counterclockwise and positive rounds outward; walk it clockwise and the same
  positive value cuts inward ([curve/polyline2d](../references/curve/polyline2d.md)).
- Points must share one z. Draw in XY and orient with the shape rotation/transform
  (e.g. rotate an XY profile by `[Math.PI/2, 0, 0]` to stand it in XZ for a revolve
  about +Z) — the bulges follow the transform.
- Line + arc chains work too, but choose each arc's constructor by what it pins:
  `curve.arcBy3Points` (a point on the arc), `curve.arcByCenterRadAngle`
  (counterclockwise about an explicit `normal`) or `curve.arcByCenter`, whose
  `isClockwise` means major (`true`) / minor (`false`) arc, not a world direction
  ([curve/arcByCenter](../references/curve/arcByCenter.md)).

## Instancing without a pattern feature

Direct flows repeat a shape by extruding it N times with a rotation transform
(`rotation: [0, 0, k * 2*Math.PI / N]` on each extrusion), then subtracting each —
or subtracting a merged set. Sequential single subtractions are robust and give
per-step error localization:

```
blank revolve → subtract teeth → subtract bore → subtract keyway → subtract screw holes → …
```

## The recalc trap

**Don't call `common.recalc` in a direct/EIF flow — it isn't needed.** The solid ops
maintain their own state; read results directly. A recalc invalidates `curve.*` shape ids
and has destroyed bodies in complex EIF sessions (a sprocket blank minus many tools); a
simple box − cylinder subtraction survived one unchanged
([solid/subtraction](../references/solid/subtraction.md)). Keep `recalc: false` (the
default) on `api.graphic()` and snapshots.

## Verify

`part.calculateMassProperties` after the final op (volume, COG), plus one or two
geometry probes — [recipes/verification](verification.md). If mass
properties return null on a body that existed a step earlier, a degenerate boolean
(or, in complex cases, a recalc) destroyed it.

## When to prefer this over the feature tree

| Situation                                             | Use                                                                        |
| ----------------------------------------------------- | -------------------------------------------------------------------------- |
| Model should regenerate on parameter change           | feature tree + expressions → [recipes/parametric-part](parametric-part.md) |
| Generated one-shot geometry, imported/computed shapes | EIF + solid.\* (this recipe)                                               |
| User will edit features interactively later           | feature tree                                                               |

## Related

[part/entityInjection](../references/part/entityInjection.md) ·
[solid/curves-parameter](../references/solid/curves-parameter.md) ·
[solid/target-tools-pattern](../references/solid/target-tools-pattern.md) ·
[solid/subtraction](../references/solid/subtraction.md)
