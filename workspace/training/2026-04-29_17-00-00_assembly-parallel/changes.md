# Changes — assembly.parallel training

## New files

### references/assembly/parallel.md
```diff
+ # assembly.parallel
+ Creates a parallel constraint between two instances, allowing 4 degrees of freedom:
+ rotation around Z axis AND translation along all 3 axes (X, Y, Z).
+ - Key parameters: id, mate1/mate2 (path, csys, flip, reorient),
+   xOffsetLimits, yOffsetLimits, zOffsetLimits, zRotationLimits, name
+ - 4 DOF comparison table: revolute(1) < cylindrical(2) < planar(3) < parallel(4)
+ - No fixed offsets — only range limits for all 3 translation axes
+ - Batch creation, error table, working example
```

### references/assembly/updateParallel.md
```diff
+ # assembly.updateParallel
+ Updates parallel constraint by constraint ID. All params optional.
+ - Can add limits after creation, rename, change flip/reorient
+ - Clearing limits: pass null (not 'VOID', not {})
+ - Deg expressions accepted in updates
```

### references/assembly/getParallel.md
```diff
+ # assembly.getParallel
+ Retrieves parallel constraint by name from assembly.
+ - Must use assembly ID, NOT instance ID
+ - Returns full definition including all limits in radians
+ - Cross-type name collision gotcha
```
