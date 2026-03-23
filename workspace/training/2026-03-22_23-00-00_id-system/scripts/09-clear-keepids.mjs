// Q: How does clear() with keepIds work? Does it preserve those objects? Are their IDs still valid?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1' })).result
  console.log('[09] partId:', partId, 'boxId:', boxId, 'cylId:', cylId)

  // Clear but keep the part
  const r1 = await api.v1.common.clear({ keepIds: [partId] })
  console.log('[09] clear keepIds=[partId]:', r1.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r1.maxLevel)

  // Check if partId is still valid
  const r2 = await api.v1.common.setObjectName({ id: partId, name: 'StillHere?' })
  console.log('[09] partId still valid?', r2.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r2.maxLevel)

  // Check if boxId is still valid (it's a child of part)
  const r3 = await api.v1.common.setObjectName({ id: boxId, name: 'BoxStillHere?' })
  console.log('[09] boxId still valid?', r3.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r3.maxLevel, 'msgs:', JSON.stringify(r3.messages.map(m => m.message)))

  // Check structure after clear+keep
  const r4 = await api.v1.common.getAppVersion({})
  const tree = r4.structure?.tree || {}
  console.log('[09] objects after clear+keep:', Object.keys(tree).length)
  for (const [k, n] of Object.entries(tree)) {
    console.log(`[09]   id=${n.id} class=${n.class} name="${n.name}"`)
  }
}
