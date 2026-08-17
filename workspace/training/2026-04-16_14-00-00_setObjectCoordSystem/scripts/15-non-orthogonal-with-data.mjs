// Verify non-orthogonal vectors with STEP data — does the server orthogonalize?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NonOrthData' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 30, height: 20 })).result
  console.log('[15] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  const step0 = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result
  filewrite(step0.content, 'step-0-initial')

  // Apply non-orthogonal vectors
  const r = await api.v1.common.setObjectCoordSystem({
    id: eifId,
    origin: [0, 0, 0],
    xVec: [1, 0, 0],
    yVec: [1, 1, 0], // 45 degrees to xVec, not perpendicular
  })
  console.log('[15] non-orthogonal result:', r.result, 'maxLevel:', r.maxLevel)

  const step1 = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result
  filewrite(step1.content, 'step-1-after-non-orthogonal')
  console.log('[15] STEP files differ:', step0.content !== step1.content)
  console.log('[15] step0 len:', step0.content.length, 'step1 len:', step1.content.length)

  // Now apply orthogonal vectors as control — 45 degrees but orthogonal
  const r2 = await api.v1.common.setObjectCoordSystem({
    id: eifId,
    origin: [0, 0, 0],
    xVec: [1, 0, 0],
    yVec: [0, 1, 0], // standard orthogonal
  })
  const step2 = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result
  filewrite(step2.content, 'step-2-after-reset')
  console.log('[15] step1→step2 differ:', step1.content !== step2.content)
  console.log('[15] step0==step2:', step0.content === step2.content)

  return { partId, eifId, boxId }
}
