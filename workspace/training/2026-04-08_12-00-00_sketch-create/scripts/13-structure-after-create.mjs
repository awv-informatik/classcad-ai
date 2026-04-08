// Test: examine structure tree after sketch creation — what objects are created?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result

  // Capture structure BEFORE sketch
  const before = await api.v1.common.getAppVersion({})
  const structBefore = before.structure
  filewrite(structBefore, 'structure-before')

  // Create sketch
  const skR = await api.v1.sketch.create({ id: partId, name: 'InspectMe' })
  const skId = skR.result
  console.log('[13] sketchId:', skId)

  // Capture structure AFTER sketch
  filewrite(skR.structure, 'structure-after')

  // Find all new objects by comparing tree keys
  const beforeKeys = Object.keys(structBefore.tree).map(Number)
  const afterKeys = Object.keys(skR.structure.tree).map(Number)
  const newIds = afterKeys.filter(k => !beforeKeys.includes(k))

  console.log('[13] new IDs after sketch creation:', newIds)
  const newObjects = {}
  newIds.forEach(id => {
    const obj = skR.structure.tree[id]
    newObjects[id] = { class: obj.class, name: obj.name, parent: obj.parent }
    console.log('[13]   id:', id, 'class:', obj.class, 'name:', obj.name, 'parent:', obj.parent)
  })
  filewrite(newObjects, 'new-objects')

  return { partId, skId }
}
