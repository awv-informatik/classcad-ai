# Changes — assembly.spherical training

## New files

- `references/assembly/spherical.md` — main LLM doc for spherical constraint (ball joint, 3 DOF)
- `references/assembly/updateSpherical.md` — update API doc
- `references/assembly/getSpherical.md` — get/retrieve API doc

## Key additions

```diff
+# assembly.spherical
+
+Creates a spherical (ball joint) constraint between two instances, allowing 3 rotational degrees of freedom.
+
+- `yRotationLimits` (optional) — object with a **single** property `max`. Unlike revolute/cylindrical which have `{ min, max }`, spherical only has `{ max }`.
+- **Negative max is silently accepted.** Passing `yRotationLimits: { max: -1 }` succeeds without error — behavior undefined.
+- **Empty `yRotationLimits: {}` errors.** Passing an empty object fails with code 1003.
```

```diff
+# assembly.updateSpherical
+
+- `null` — remove all limits (max becomes null)
+- **Mate retarget works.** Can switch which WCS a mate references by providing new `path` + `csys`.
```

```diff
+# assembly.getSpherical
+
+- **yRotationLimits.max is always present** — either as a radian value or `null`. No `min` property exists.
+- **Degree expressions stored as radians.** `'60deg'` → `1.0471975511965976`.
```
