// Test: is setObjectCoordSystem cumulative or absolute?
// Apply twice and check if the second overwrites or compounds with the first.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Cumulative' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  // Reference sphere (won't move — it's a separate solid inside EIF)
  // Actually, the sphere IS inside the same EIF, so it will move with it
  console.log('[13] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Save initial STEP
  const step0 = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result
  filewrite(step0.content, 'step-0-initial')

  // First application: move to [50, 0, 0]
  await api.v1.common.setObjectCoordSystem({
    id: boxId,
    origin: [50, 0, 0],
    xVec: [1, 0, 0],
    yVec: [0, 1, 0],
  })
  const step1 = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result
  filewrite(step1.content, 'step-1-after-first')
  console.log('[13] step0→step1 differ:', step0.content !== step1.content)

  // Second application: move to [50, 0, 0] again
  // If absolute: box stays at [50, 0, 0]
  // If cumulative: box moves to [100, 0, 0]
  await api.v1.common.setObjectCoordSystem({
    id: boxId,
    origin: [50, 0, 0],
    xVec: [1, 0, 0],
    yVec: [0, 1, 0],
  })
  const step2 = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result
  filewrite(step2.content, 'step-2-after-second')
  console.log('[13] step1→step2 differ:', step1.content !== step2.content)

  // If step1 == step2, it's absolute. If step1 != step2, it's cumulative.
  console.log('[13] step0 len:', step0.content.length,
    'step1 len:', step1.content.length,
    'step2 len:', step2.content.length)

  return { partId, eifId, boxId }
}
