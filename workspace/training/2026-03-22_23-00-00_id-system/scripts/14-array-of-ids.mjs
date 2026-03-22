// Q: APIs that accept Array<id> — how do they work? Test clear.keepIds, setAppearance batch, etc.
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result
  const boxId = (await execute({ 'v1.part.box': [{ id: partId, name: 'Box1' }] })).result
  const cylId = (await execute({ 'v1.part.cylinder': [{ id: partId, name: 'Cyl1' }] })).result
  console.log('[14] partId:', partId, 'boxId:', boxId, 'cylId:', cylId)

  // clear with keepIds as array of numbers
  // First, let's test requestVisualisation with array of IDs
  const r1 = await execute({ 'v1.common.requestVisualisation': [{ ids: [boxId, cylId] }] })
  console.log('[14] requestVisualisation [boxId, cylId]:', r1.maxLevel <= 31 ? '✓' : '❌')

  // setAppearance batch: pass array of param objects
  const r2 = await execute({ 'v1.common.setAppearance': [
    { target: boxId, color: [255, 0, 0] },
    { target: cylId, color: [0, 255, 0] },
  ] })
  console.log('[14] setAppearance batch:', r2.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r2.maxLevel)

  // setAppearance with string IDs in array
  const r3 = await execute({ 'v1.common.requestVisualisation': [{ ids: [String(boxId), String(cylId)] }] })
  console.log('[14] requestVisualisation string IDs:', r3.maxLevel <= 31 ? '✓' : '❌')

  // clear keepIds with string IDs
  const r4 = await execute({ 'v1.common.clear': [{ keepIds: [String(partId)] }] })
  console.log('[14] clear keepIds string:', r4.maxLevel <= 31 ? '✓' : '❌')

  // Are box and cyl still there?
  const r5 = await execute({ 'v1.common.setObjectName': [{ id: boxId, name: 'BoxAfterClear' }] })
  console.log('[14] boxId still valid?', r5.maxLevel <= 31 ? '✓' : '❌')
}
