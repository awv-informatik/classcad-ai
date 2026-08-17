# Changes: assembly.gear training

## New file: `references/assembly/gear.md`

```diff
+# assembly.gear
+
+Creates a gear relation linking two **revolute** constraints. When one revolute rotates, the other rotates proportionally by the gear ratio with optional angular offset.
+
+## Prerequisites
+
+- An assembly root (`assembly.create`)
+- **Two revolute constraints** (`assembly.revolute`). No other constraint type is accepted — cylindrical, planar, slider, spherical, fastened, fastenedOrigin all fail with: `"wrong id type! Provide only following id types: [\"revoluteconstraint\"]"`
+- At least one instance grounded with `fastenedOrigin` (otherwise solver behavior is unpredictable)
+
+## Key Parameters
+
+- `id` — assembly root ID (required)
+- `constr1Id` — ID of the first revolute constraint (required)
+- `constr2Id` — ID of the second revolute constraint (required)
+- `ratio` — rotational velocity ratio (default 1). See coupling formula below.
+- `offset` — angular offset for constr2 in radians (default 0). Accepts degree strings.
+- `name` — relation name (default "GearRelation")
+
+## Coupling Formula (CRITICAL)
+
+arm2_rotation = -(ratio × constr1_angle) + offset
+
+- Positive ratio → counter-rotating (meshing gears)
+- Negative ratio → co-rotating (belt/chain drive)
+- ratio=0 → decoupled
+
+## Key Findings
+
+- Gear ONLY accepts revolute constraint IDs (error 1001 for anything else)
+- getGear requires assembly root ID (instance/template fail)
+- getGear returns { id, name, constr1Id, constr2Id, ratio, offset } with offset in radians
+- updateGear is true partial update, supports rename, takes gear relation ID (not assembly ID)
+- Self-linking (same revolute for both) is silently allowed
+- Without explicit drive, solver redistributes offset across free DOFs unpredictably
```
