export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TargetFmt' })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result

  // Test 1: target as plain ID (like script 01)
  const r1 = await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: box1,
    tools: [box2],
  })
  console.log('[04] plain ID — result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Now test target as object form {id, indices}
  const partId2 = (await api.v1.part.create({ name: 'TargetObj' })).result
  const box3 = (await api.v1.part.box({ id: partId2, name: 'Base2', length: 80, width: 60, height: 40 })).result
  const box4 = (await api.v1.part.box({ id: partId2, name: 'Tool2', length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result

  const r2 = await api.v1.part.boolean({
    id: partId2,
    type: 'UNION',
    target: { id: box3 },
    tools: [box4],
  })
  console.log('[04] object {id} — result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Test tools as object form too
  const partId3 = (await api.v1.part.create({ name: 'ToolsObj' })).result
  const box5 = (await api.v1.part.box({ id: partId3, name: 'Base3', length: 80, width: 60, height: 40 })).result
  const box6 = (await api.v1.part.box({ id: partId3, name: 'Tool3', length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result

  const r3 = await api.v1.part.boolean({
    id: partId3,
    type: 'UNION',
    target: { id: box5 },
    tools: [{ id: box6 }],
  })
  console.log('[04] both object — result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({ plainId: { result: r1.result, maxLevel: r1.maxLevel }, objectId: { result: r2.result, maxLevel: r2.maxLevel }, bothObject: { result: r3.result, maxLevel: r3.maxLevel } }, 'target-formats')

  return { partId }
}
