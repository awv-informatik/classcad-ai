export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DefaultsTest' })).result

  // Create uncommitted box — check what defaults it gets
  const boxId = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'DefaultBox' })).result

  // Dump its structure BEFORE open/close to see default members
  const r1 = await api.v1.common.recalc({})
  const tree1 = r1.structure?.tree
  if (tree1?.[boxId]) {
    console.log('[11] default box members:', JSON.stringify(tree1[boxId].members))
    filewrite(tree1[boxId], 'default-box-node')
  }

  // Commit with defaults (open + update + close but with no specific dims changed)
  await api.v1.part.openFeature({ id: boxId })
  // Update with explicit defaults to see what happens
  const updateR = await api.v1.part.updateBox({ id: boxId })
  console.log('[11] updateBox (no params):', updateR.result, 'maxLevel:', updateR.maxLevel)
  await api.v1.part.closeFeature({ id: boxId })

  const r2 = await api.v1.common.recalc({})
  const tree2 = r2.structure?.tree
  if (tree2?.[boxId]) {
    filewrite(tree2[boxId], 'committed-box-node')
    console.log('[11] committed box length:', tree2[boxId].members?.length?.value, 'width:', tree2[boxId].members?.width?.value, 'height:', tree2[boxId].members?.height?.value)
  }

  await snapshot('default-box')

  // Also: create uncommitted cylinder and check its defaults
  const cylId = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Cylinder', name: 'DefaultCyl' })).result
  const r3 = await api.v1.common.recalc({})
  const tree3 = r3.structure?.tree
  if (tree3?.[cylId]) {
    console.log('[11] cylinder defaults:', JSON.stringify(tree3[cylId].members))
    filewrite(tree3[cylId], 'default-cyl-node')
  }

  await api.v1.part.openFeature({ id: cylId })
  await api.v1.part.updateCylinder({ id: cylId, height: 50, diameter: 30 })
  await api.v1.part.closeFeature({ id: cylId })

  await snapshot('cylinder-added')
  return { partId, boxId, cylId }
}
