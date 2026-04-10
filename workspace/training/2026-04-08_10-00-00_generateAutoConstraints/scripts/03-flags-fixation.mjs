// Test: genFixation with JS false — should skip fixation but add H constraint
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineR = await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })
  const lineId = lineR.result
  const bTree = lineR.structure.tree

  // Try JS boolean false for genFixation
  const r = await api.v1.sketch.generateAutoConstraints({
    id: skId, geomId: lineId, genFixation: false,
  })
  console.log('[03] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))

  const aTree = r.structure.tree
  const bIds = new Set(Object.keys(bTree))
  const newIds = Object.keys(aTree).filter(id => !bIds.has(id))
  console.log('[03] new objects (genFixation=false):')
  newIds.forEach(id => {
    const o = aTree[id]
    console.log('  ID', id, '→', o.class, JSON.stringify(o.name))
  })

  return { partId }
}
