// Can you openFeature on a feature that's behind the RollbackBar?
// Tree: Box → Cyl → Sph. Roll back before Sph, then try to open Sph.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OpenBehind' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', radius: 15, height: 60 })).result
  const sphId = (await api.v1.part.sphere({ id: partId, name: 'Sph1', radius: 20, position: [40, 0, 0] })).result
  console.log('[06] box:', boxId, 'cyl:', cylId, 'sph:', sphId)

  // Roll back before sphere — sphere is now "hidden"
  await api.v1.part.operationMoveBefore({ id: partId, featureId: sphId })
  console.log('[06] Rolled back before Sph1')

  // Try to open Sph1 — it's behind the bar
  const openR = await api.v1.part.openFeature({ id: sphId })
  console.log('[06] openFeature(sph) result:', openR.result, 'maxLevel:', openR.maxLevel)
  if (openR.messages?.length) console.log('[06]   msg:', openR.messages[0]?.message)

  // If open worked, try updating
  if (openR.maxLevel <= 31) {
    const updateR = await api.v1.part.updateSphere({ id: sphId, radius: 30 })
    console.log('[06] updateSphere result:', updateR.result, 'maxLevel:', updateR.maxLevel)
    if (updateR.messages?.length) console.log('[06]   msg:', updateR.messages[0]?.message)

    await api.v1.part.closeFeature({ id: sphId })
    console.log('[06] Closed Sph1')
  }

  // Also try: open Box1 (which is BEFORE the bar — fully visible)
  const openR2 = await api.v1.part.openFeature({ id: boxId })
  console.log('[06] openFeature(box) result:', openR2.result, 'maxLevel:', openR2.maxLevel)
  if (openR2.maxLevel <= 31) {
    await api.v1.part.closeFeature({ id: boxId })
    console.log('[06] Closed Box1')
  }

  // Restore
  await api.v1.part.operationMoveToEnd({ id: partId })
  console.log('[06] Moved bar back to end')

  return { partId }
}
