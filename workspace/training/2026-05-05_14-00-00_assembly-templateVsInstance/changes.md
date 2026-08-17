# Changes — Template vs Instance Paradigm

## New file: `references/assembly/generic.md`

Created comprehensive LLM doc covering the template/instance paradigm:
- Structure tree encoding (CC_ProductReference with link + coordinateSystem)
- Propagation rules (live by default, materialized by calculateMassProperties on instance)
- ID usage (string names, instance vs part IDs)
- Modification and deletion patterns
- Context switching behavior

## Modified: `references/assembly/partTemplate.md`

Corrected the propagation claim:

```diff
-- **Template updates do NOT propagate to existing instances.** Instances snapshot the template geometry at creation time. Modifying the template (openFeature → updateBox → closeFeature → recalc) updates the template itself but existing instances retain their original geometry. New instances created after the modification get the updated geometry. To apply changes to existing instances: delete and re-create them.
+- **Template updates DO propagate to unmaterialized instances.** Instances start as live references — modifying a template (openFeature → updateBox → closeFeature → recalc) updates all instances that haven't been "materialized." Materialization occurs when `calculateMassProperties` is called directly on an instance ID (which locks ALL instances of that template). After materialization, instances retain their geometry independently. To apply changes to materialized instances: delete and re-create them. See `references/assembly/generic.md` for the full propagation rules.
```
