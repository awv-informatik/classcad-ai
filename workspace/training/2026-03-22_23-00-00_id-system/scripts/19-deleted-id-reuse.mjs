// Q: What happens to IDs of deleted features? Can they be reused? Do IDs ever get recycled?
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result
  const box1Id = (await execute({ 'v1.part.box': [{ id: partId, name: 'Box1' }] })).result
  const box2Id = (await execute({ 'v1.part.box': [{ id: partId, name: 'Box2' }] })).result
  console.log('[19] partId:', partId, 'box1Id:', box1Id, 'box2Id:', box2Id)

  // Delete box1 using part.deleteFeature (if it exists) or just check what happens after clear+keep
  // Let's try: clear keeping only part, which should remove features
  // Actually, script 09 showed clear keepIds preserves children. Let me use part.deleteFeature
  const r1 = await execute({ 'v1.part.deleteFeature': [{ id: box1Id }] })
  console.log('[19] deleteFeature box1:', r1.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages?.map(m => m.message)))

  if (r1.maxLevel <= 31) {
    // Check if box1Id is still valid
    const r2 = await execute({ 'v1.common.setObjectName': [{ id: box1Id, name: 'Deleted?' }] })
    console.log('[19] box1Id after delete:', r2.maxLevel <= 31 ? '✓ still valid' : '❌ invalid')

    // Create a new box — does it reuse the old ID?
    const box3Id = (await execute({ 'v1.part.box': [{ id: partId, name: 'Box3' }] })).result
    console.log('[19] new boxId:', box3Id, 'reuses box1Id?', box3Id === box1Id)
  }

  // Also: what's the max ID gap between two creations?
  const box4Id = (await execute({ 'v1.part.box': [{ id: partId, name: 'Box4' }] })).result
  const box5Id = (await execute({ 'v1.part.box': [{ id: partId, name: 'Box5' }] })).result
  console.log('[19] box4:', box4Id, 'box5:', box5Id, 'gap:', box5Id - box4Id)
}
