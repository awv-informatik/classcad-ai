// Test: USERDEFINED with defaults + custom position
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Defaults
  const r1 = await api.v1.part.workPoint({ id: partId })
  console.log('[01] default result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Custom position
  const r2 = await api.v1.part.workPoint({ id: partId, name: 'WP_custom', position: [50, 30, 20] })
  console.log('[01] custom result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Negative position
  const r3 = await api.v1.part.workPoint({ id: partId, name: 'WP_neg', position: [-10, -20, -30] })
  console.log('[01] neg result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    default: { result: r1.result, maxLevel: r1.maxLevel },
    custom: { result: r2.result, maxLevel: r2.maxLevel },
    neg: { result: r3.result, maxLevel: r3.maxLevel }
  }, 'responses')

  await snapshot('userdefined')
  return { partId }
}
