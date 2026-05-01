# Skill Changes — assembly.slider / updateSlider / getSlider

## New Files

- `references/assembly/slider.md` — 111 lines
- `references/assembly/updateSlider.md` — 67 lines
- `references/assembly/getSlider.md` — 52 lines

## Diff

```diff
+# assembly.slider
+
+Creates a slider constraint between two instances, allowing 1 degree of freedom: translation along the constraint's Z axis. No rotation is permitted — the orientation is fully locked. Think of it as a linear guide or prismatic joint.
+
+## Prerequisites
+- A root assembly (`assembly.create`)
+- At least two instances with work coordinate systems in their templates
+- Must be in assembly context (`setCurrentProduct({ id: asmId })`)
+
+## Key Parameters
+- `id` (required) — assembly ID where the constraint is created
+- `mate1` / `mate2` (both required) — path, csys, flip, reorient
+- `xOffset` (optional, default 0) — fixed offset along X axis (mm), constant not range
+- `yOffset` (optional, default 0) — fixed offset along Y axis (mm), constant not range
+- `zOffsetLimits` (optional) — `{ min, max }`, partial allowed on create, empty `{}` errors code 1003
+- `name` (optional, default 'Slider')
+
+## Key Findings
+- Slider = 1 DOF translation only (prismatic joint), no rotation params
+- xOffset/yOffset are fixed transverse displacements, NOT limits
+- zOffsetLimits allows partial specs on create (min-only or max-only)
+- Partial updates preserve untouched side; null clears both limits
+- Cross-type name collision: getSlider returns null if non-slider constraint was created first with same name
+- getSlider requires assembly ID, not instance ID
+- deleteConstraint uses `ids` (plural array), not `id`
```

```diff
+# assembly.updateSlider
+- id = constraint ID (not assembly ID)
+- Partial zOffsetLimits updates preserve the untouched side
+- null clears both limits to { min: null, max: null }
+- Mate updates require path + csys in the mate object
```

```diff
+# assembly.getSlider
+- Returns: { id, name, mate1, mate2, xOffset, yOffset, zOffsetLimits }
+- Assembly ID required (instance ID fails)
+- Duplicate names: returns first match
+- Cross-type collision: returns null if non-slider constraint has same name
```
