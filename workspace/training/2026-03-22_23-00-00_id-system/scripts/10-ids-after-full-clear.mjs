// Q: After a full clear(), are old IDs invalidated? Do new IDs start over or continue the sequence?
export default async function ({ execute }) {
  const partId1 = (await execute({ 'v1.part.create': [{ name: 'Part1' }] })).result
  const boxId1 = (await execute({ 'v1.part.box': [{ id: partId1, name: 'Box1' }] })).result
  console.log('[10] first session: partId:', partId1, 'boxId:', boxId1)

  // Full clear
  await execute({ 'v1.common.clear': [{}] })

  // Try to use old IDs
  const r1 = await execute({ 'v1.common.setObjectName': [{ id: partId1, name: 'Ghost?' }] })
  console.log('[10] old partId after clear:', r1.maxLevel <= 31 ? '✓ still valid' : '❌ invalid', 'maxLevel:', r1.maxLevel)

  const r2 = await execute({ 'v1.common.setObjectName': [{ id: boxId1, name: 'GhostBox?' }] })
  console.log('[10] old boxId after clear:', r2.maxLevel <= 31 ? '✓ still valid' : '❌ invalid', 'maxLevel:', r2.maxLevel)

  // Create new part — do IDs restart or continue?
  const partId2 = (await execute({ 'v1.part.create': [{ name: 'Part2' }] })).result
  const boxId2 = (await execute({ 'v1.part.box': [{ id: partId2, name: 'Box2' }] })).result
  console.log('[10] second session: partId:', partId2, 'boxId:', boxId2)
  console.log('[10] IDs restart?', partId2 === partId1 ? 'YES — same IDs' : 'NO — different IDs')
}
