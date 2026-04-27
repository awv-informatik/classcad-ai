// Mid-tree editing with downstream boolean: does the boolean survive and recalculate?
// Create Box → Cylinder → Boolean(subtraction). Open Box, update it, close.
// Does the boolean recalculate with the new box dimensions?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolSurvival' })).result

  // Create box
  const boxId = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  console.log('[05] boxId:', boxId)

  // Create cylinder that overlaps the box (for subtraction)
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Tool', radius: 12, height: 80, position: [40, 30, -10] })).result
  console.log('[05] cylId:', cylId)

  // Boolean subtraction: cut cylinder from box
  const boolId = (await api.v1.part.boolean({
    id: partId,
    name: 'BoolSub',
    type: 'SUBTRACTION',
    target: boxId,
    tools: [cylId],
  })).result
  console.log('[05] boolId:', boolId)

  await snapshot('01-initial')

  // Now open the BOX (first feature) — the boolean depends on it
  console.log('[05] Opening Box (first feature in tree)...')
  const openR = await api.v1.part.openFeature({ id: boxId })
  console.log('[05] openFeature result:', openR.result, 'maxLevel:', openR.maxLevel)

  await snapshot('02-box-open')

  // Update the box dimensions — make it bigger
  const updateR = await api.v1.part.updateBox({ id: boxId, length: 120, width: 100, height: 60 })
  console.log('[05] updateBox result:', updateR.result, 'maxLevel:', updateR.maxLevel)

  await snapshot('03-box-updated-open')

  // Close the feature — boolean should recalculate
  const closeR = await api.v1.part.closeFeature({ id: boxId })
  console.log('[05] closeFeature result:', closeR.result, 'maxLevel:', closeR.maxLevel)

  await snapshot('04-after-close')

  // Verify: can we still find the boolean?
  const findBool = await api.v1.part.getFeature({ id: partId, name: 'BoolSub' })
  console.log('[05] Boolean still exists:', findBool.result ? `YES id=${findBool.result}` : 'NO')

  // Dump the final structure to verify tree integrity
  const finalR = await api.v1.part.getFeature({ id: partId, name: 'Base' })
  const tree = finalR.structure.tree
  const opSeqChildren = Object.values(tree)
    .filter(n => n.parent === 18)
    .map(n => ({ id: n.id, class: n.class, name: n.name }))
  console.log('[05] Final OperationSequence:')
  opSeqChildren.forEach(c => console.log(`  ${c.id}: ${c.class} "${c.name}"`))
  filewrite(opSeqChildren, 'final-opseq')

  return { partId }
}
