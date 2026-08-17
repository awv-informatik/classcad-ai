# Skill Changes — assembly.updateRevolute

## New file: `references/assembly/updateRevolute.md`

Full LLM doc for `assembly.updateRevolute` covering:
- Key parameters (id, name, mate1/mate2, zOffset, zRotationLimits)
- Partial update behavior (all fields preserved when not specified)
- zRotationLimits granular control (partial limits, individual removal with null)
- Retargeting to different instances
- Batch update
- Key difference from create (partial limits allowed on update)
- Error catalog (5 error types with codes)
- Working examples

## Modified: `references/assembly/revolute.md`

Updated the `## updateRevolute` summary section to:
- Add cross-reference to the new dedicated doc
- Note partial zRotationLimits support (differs from create)
- Note individual limit removal with `{ max: null }`
- Note retargeting via mate.path + mate.csys

```diff
-`updateRevolute({ id: constraintId, ... })` — update any property by constraint ID.
+`updateRevolute({ id: constraintId, ... })` — update any property by constraint ID. See `references/assembly/updateRevolute.md` for full docs.

-- All properties updatable: name, zOffset, zRotationLimits, mate1/mate2 flip/reorient
-- Pass `zRotationLimits: null` to remove rotation limits
+- All properties updatable: name, zOffset, zRotationLimits, mate1/mate2 (path, csys, flip, reorient)
+- **Partial zRotationLimits allowed** (unlike create): can set min-only or max-only
+- Pass `zRotationLimits: null` to remove all limits; `{ max: null }` to remove just max
+- Can retarget to a different instance via `mate.path` + `mate.csys`
```
