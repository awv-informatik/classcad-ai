export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroNeg' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Zero length — does it create degenerate geometry?
  const r1 = await api.v1.solid.box({ id: eifId, length: 0, width: 50, height: 50 })
  console.log('[08] zero-length box id:', r1.result)
  // Check if graphic data exists
  const hasGraphic1 = r1.graphic && r1.graphic.length > 0
  console.log('[08] zero-length has graphic:', hasGraphic1)

  await snapshot('zero-length')

  // Clear and try negative
  await api.v1.solid.deleteSolid({ id: eifId })

  const r2 = await api.v1.solid.box({ id: eifId, length: -50, width: 50, height: 50 })
  console.log('[08] negative-length box id:', r2.result)

  await snapshot('negative-length')

  // Clear and try all-negative
  await api.v1.solid.deleteSolid({ id: eifId })

  const r3 = await api.v1.solid.box({ id: eifId, length: -50, width: -30, height: -20 })
  console.log('[08] all-negative box id:', r3.result)

  await snapshot('all-negative')

  // Compare: normal box for reference
  await api.v1.solid.deleteSolid({ id: eifId })
  const r4 = await api.v1.solid.box({ id: eifId, length: 50, width: 30, height: 20 })
  await snapshot('normal-reference')

  filewrite({
    zeroLength: { result: r1.result, maxLevel: r1.maxLevel },
    negativeLength: { result: r2.result, maxLevel: r2.maxLevel },
    allNegative: { result: r3.result, maxLevel: r3.maxLevel },
    normalRef: { result: r4.result, maxLevel: r4.maxLevel },
  }, 'zero-neg-verify')

  return { partId }
}
