export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MissingParams' })).result

  // Test missing params
  // Missing type
  const r1 = await api.v1.part.createUncommitedObject({ id: partId, name: 'NoType' })
  console.log('[13] no type:', r1.result, 'maxLevel:', r1.maxLevel, 'msg:', r1.messages?.[0]?.message || 'none')

  // Missing name
  const r2 = await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box' })
  console.log('[13] no name:', r2.result, 'maxLevel:', r2.maxLevel, 'msg:', r2.messages?.[0]?.message || 'none')
  if (r2.result) {
    // Check what name it gets
    const tree = r2.structure?.tree
    if (tree?.[r2.result]) {
      console.log('[13] auto-name:', tree[r2.result].name)
    }
    await api.v1.part.openFeature({ id: r2.result })
    await api.v1.part.updateBox({ id: r2.result })
    await api.v1.part.closeFeature({ id: r2.result })
  }

  // Missing id (no part context)
  const r3 = await api.v1.part.createUncommitedObject({ type: 'CC_Box', name: 'NoId' })
  console.log('[13] no id:', r3.result, 'maxLevel:', r3.maxLevel, 'msg:', r3.messages?.[0]?.message || 'none')

  // Duplicate name (same name as existing committed feature)
  const box1 = (await api.v1.part.box({ id: partId, name: 'DupName', length: 30, width: 20, height: 10 })).result
  const r4 = await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'DupName' })
  console.log('[13] dup name:', r4.result, 'maxLevel:', r4.maxLevel, 'msg:', r4.messages?.[0]?.message || 'none')
  if (r4.result) {
    await api.v1.part.openFeature({ id: r4.result })
    await api.v1.part.updateBox({ id: r4.result })
    await api.v1.part.closeFeature({ id: r4.result })
  }

  filewrite(
    {
      noType: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
      noName: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
      noId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
      dupName: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
    },
    'missing-params',
  )

  return { partId }
}
