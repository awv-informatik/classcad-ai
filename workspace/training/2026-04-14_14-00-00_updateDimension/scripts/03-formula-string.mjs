// Test updateDimension with formula strings like '50+10', 'sqrt(2)*50'
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'FormulaTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  const pts = (await api.v1.sketch.getPoints({ id: rectIds[0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  const dimId = (await api.v1.sketch.dimension({ id: skId, name: 'width', type: 'OFFSET', geomIds: [rectIds[0]] })).result

  // Test 1: formula string '50+70'
  const upd1 = await api.v1.sketch.updateDimension({ id: dimId, value: '50+70' })
  const pos1 = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  console.log('[03] formula "50+70" result:', upd1.result, 'maxLevel:', upd1.maxLevel, 'endX:', pos1.endPos.x)

  // Test 2: formula with function 'sqrt(2)*50'
  const upd2 = await api.v1.sketch.updateDimension({ id: dimId, value: 'sqrt(2)*50' })
  const pos2 = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  console.log('[03] formula "sqrt(2)*50" result:', upd2.result, 'maxLevel:', upd2.maxLevel, 'endX:', pos2.endPos.x)

  // Test 3: deg suffix for angle-related (but this is OFFSET, so just numeric)
  const upd3 = await api.v1.sketch.updateDimension({ id: dimId, value: '100' })
  const pos3 = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  console.log('[03] string "100" result:', upd3.result, 'maxLevel:', upd3.maxLevel, 'endX:', pos3.endPos.x)

  await snapshot('result')

  filewrite({
    formula1: { result: upd1.result, maxLevel: upd1.maxLevel, endX: pos1.endPos.x, expected: 120 },
    formula2: { result: upd2.result, maxLevel: upd2.maxLevel, endX: pos2.endPos.x, expected: Math.sqrt(2) * 50 },
    stringNum: { result: upd3.result, maxLevel: upd3.maxLevel, endX: pos3.endPos.x, expected: 100 },
  }, 'formula-data')

  return { partId }
}
