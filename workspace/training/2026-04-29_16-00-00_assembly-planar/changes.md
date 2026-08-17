# Changes — assembly.planar / updatePlanar / getPlanar

## New files

- `references/assembly/planar.md` — 3-DOF planar constraint (Z rotation + X/Y translation)
- `references/assembly/updatePlanar.md` — update planar constraint properties
- `references/assembly/getPlanar.md` — retrieve planar constraint by name

## Diff summary

Three new LLM doc files created. Key documented findings:

- Planar has 3 DOF: rotation around Z + translation along X + translation along Y
- Has `zOffset` (fixed, like revolute) plus `xOffsetLimits`/`yOffsetLimits` (ranges)
- Asymmetric partial limits: xOffsetLimits/yOffsetLimits allow partial on create, zRotationLimits requires both
- All limits accept partial specs on update; pass null to clear
- Same error patterns as revolute/cylindrical (codes 1004, 1013, 1014, 1001, 1003)
- Batch creation supported via array param
