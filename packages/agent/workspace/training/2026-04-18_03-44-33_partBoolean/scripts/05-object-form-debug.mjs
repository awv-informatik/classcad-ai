export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ObjFormDebug' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result

  console.log('[05] partId:', partId, 'box1:', box1, 'box2:', box2)

  // Test target as object {id: featureId}
  const r1 = await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: { id: box1 },
    tools: [box2],
  })
  console.log('[05] target={id} — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'obj-target-response')

  // If the above failed, try tools as object too — different part
  const partId2 = (await api.v1.part.create({ name: 'ObjFormDebug2' })).result
  const box3 = (await api.v1.part.box({ id: partId2, name: 'Base2', length: 80, width: 60, height: 40 })).result
  const box4 = (await api.v1.part.box({ id: partId2, name: 'Tool2', length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result

  // Test tools as object [{ id: featureId }]
  const r2 = await api.v1.part.boolean({
    id: partId2,
    type: 'UNION',
    target: box3,
    tools: [{ id: box4 }],
  })
  console.log('[05] tools=[{id}] — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'obj-tools-response')

  return { partId }
}
