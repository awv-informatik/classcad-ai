// Q: deleteFeature expects `ids` (plural). After deletion, are IDs recycled?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const box1Id = (await api.v1.part.box({ id: partId, name: 'Box1' })).result
  const box2Id = (await api.v1.part.box({ id: partId, name: 'Box2' })).result
  console.log('[20] partId:', partId, 'box1Id:', box1Id, 'box2Id:', box2Id)

  // Delete box1 using ids (plural array)
  const r1 = await api.v1.part.deleteFeature({ ids: [box1Id] })
  console.log('[20] deleteFeature box1:', r1.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages?.map(m => m.message)))

  if (r1.maxLevel <= 31) {
    // Is box1Id still valid in the system?
    const r2 = await api.v1.common.setObjectName({ id: box1Id, name: 'Ghost?' })
    console.log('[20] box1Id after delete:', r2.maxLevel <= 31 ? '✓ still valid' : '❌ invalid', 'maxLevel:', r2.maxLevel)

    // Create new box — does it reuse box1Id?
    const box3Id = (await api.v1.part.box({ id: partId, name: 'Box3' })).result
    console.log('[20] new box3Id:', box3Id, 'reuses box1Id?', box3Id === box1Id, 'gap from box2:', box3Id - box2Id)
  }
}
