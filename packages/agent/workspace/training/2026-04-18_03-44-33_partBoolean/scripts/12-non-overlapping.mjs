export default async function (api, { snapshot, filewrite }) {
  // Test: what happens with non-overlapping bodies?
  const partId = (await api.v1.part.create({ name: 'NonOverlap' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 40, width: 40, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 30, width: 30, height: 30, translation: [100, 100, 0] })).result

  console.log('[12] box1:', box1, 'box2:', box2)

  // UNION of non-overlapping — should succeed (compound solid)
  const r1 = await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: box1,
    tools: [box2],
  })
  console.log('[12] non-overlap UNION — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'non-overlap-union')
  await snapshot('union-nonoverlap')

  // SUBTRACTION of non-overlapping
  const partId2 = (await api.v1.part.create({ name: 'NonOverlap2' })).result
  const box3 = (await api.v1.part.box({ id: partId2, name: 'Base2', length: 40, width: 40, height: 40 })).result
  const box4 = (await api.v1.part.box({ id: partId2, name: 'Tool2', length: 30, width: 30, height: 30, translation: [100, 100, 0] })).result

  const r2 = await api.v1.part.boolean({
    id: partId2,
    type: 'SUBTRACTION',
    target: box3,
    tools: [box4],
  })
  console.log('[12] non-overlap SUBTRACTION — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'non-overlap-subtract')

  // INTERSECTION of non-overlapping — should fail (no overlap volume)
  const partId3 = (await api.v1.part.create({ name: 'NonOverlap3' })).result
  const box5 = (await api.v1.part.box({ id: partId3, name: 'Base3', length: 40, width: 40, height: 40 })).result
  const box6 = (await api.v1.part.box({ id: partId3, name: 'Tool3', length: 30, width: 30, height: 30, translation: [100, 100, 0] })).result

  const r3 = await api.v1.part.boolean({
    id: partId3,
    type: 'INTERSECTION',
    target: box5,
    tools: [box6],
  })
  console.log('[12] non-overlap INTERSECTION — result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }, 'non-overlap-intersect')

  return { partId }
}
