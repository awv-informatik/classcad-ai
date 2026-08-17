export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Create three boxes with default name
  const box1 = (await api.v1.part.box({ id: partId })).result
  const box2 = (await api.v1.part.box({ id: partId })).result
  const box3 = (await api.v1.part.box({ id: partId })).result
  console.log('[05] box1:', box1, 'box2:', box2, 'box3:', box3)

  // Dump structure to find actual names assigned by the system
  const r = await api.v1.part.box({ id: partId })
  filewrite(r.structure, 'full-structure')

  // Try all possible naming patterns systematically
  const names = ['Box', 'Box 1', 'Box 2', 'Box 3', 'Box 4',
                 'Box_1', 'Box_2', 'Box_3', 'Box_4',
                 'Box1', 'Box2', 'Box3', 'Box4']
  const found = {}
  for (const n of names) {
    const r = await api.v1.part.getFeature({ id: partId, name: n })
    if (r.result !== null) {
      found[n] = r.result
      console.log('[05] found "' + n + '":', r.result)
    }
  }

  // Rename box2 and try again
  await api.v1.common.setObjectName({ id: box2, name: 'RenamedBox' })
  const rRenamed = await api.v1.part.getFeature({ id: partId, name: 'RenamedBox' })
  console.log('[05] "RenamedBox" after rename:', rRenamed.result, 'match box2?', rRenamed.result === box2)

  filewrite({ box1, box2, box3, found, renamedLookup: rRenamed.result }, 'duplicate-analysis')
  return { partId }
}
