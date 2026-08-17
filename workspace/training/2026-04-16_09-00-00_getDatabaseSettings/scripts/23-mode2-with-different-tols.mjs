// 23 — Test if mode=2 behavior depends on chord/angle values
// During the original batch, mode=2 had chord=0.5, angle=15 (from script 03) and produced graphic.
// Script 22 used chord=0.1, angle=0 and got nothing. Maybe mode=2 is value-dependent?
export default async function (api, { filewrite }) {
  const results = []

  for (const [chord, angle] of [[0.1, 0], [0.5, 15], [0.5, 0], [0.1, 15], [1.0, 30]]) {
    await api.v1.common.setDatabaseSettings({
      chordHeightTol: chord, angleTol: angle, facetingParamsMode: 2,
      isGraphicEnabled: true, isCCGraphicEnabled: true
    })

    const partId = (await api.v1.part.create({ name: 'M2T' })).result
    const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

    const boxR = await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })
    const gfxSize = boxR.graphic ? JSON.stringify(boxR.graphic).length : 0

    console.log(`[23] mode=2 chord=${chord} angle=${angle}: gfxSize=${gfxSize}`)
    results.push({ mode: 2, chord, angle, gfxSize })
  }

  filewrite(results, 'mode2-tol-values')

  // Also try: set mode=0 first, then switch to mode=2 (mimicking the script 05 sequence)
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 2 })

  const partId = (await api.v1.part.create({ name: 'M2Seq' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxR = await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })
  const gfxSize = boxR.graphic ? JSON.stringify(boxR.graphic).length : 0
  console.log(`[23] mode=2 after 0→2 sequence: gfxSize=${gfxSize}`)
  results.push({ mode: '2-after-0-2', gfxSize })

  filewrite(results, 'mode2-tol-values-full')

  // Restore
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 1 })

  return results
}
