export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const boxId = (await api.v1.part.box({ id: partId })).result
  console.log('[02] boxId:', boxId)

  // Exact match
  const r1 = await api.v1.part.getFeature({ id: partId, name: 'Box' })
  console.log('[02] "Box":', r1.result, 'maxLevel:', r1.maxLevel)

  // Lowercase
  const r2 = await api.v1.part.getFeature({ id: partId, name: 'box' })
  console.log('[02] "box":', r2.result, 'maxLevel:', r2.maxLevel)

  // Uppercase
  const r3 = await api.v1.part.getFeature({ id: partId, name: 'BOX' })
  console.log('[02] "BOX":', r3.result, 'maxLevel:', r3.maxLevel)

  // Mixed
  const r4 = await api.v1.part.getFeature({ id: partId, name: 'bOx' })
  console.log('[02] "bOx":', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    exact: { result: r1.result, maxLevel: r1.maxLevel },
    lowercase: { result: r2.result, maxLevel: r2.maxLevel },
    uppercase: { result: r3.result, maxLevel: r3.maxLevel },
    mixed: { result: r4.result, maxLevel: r4.maxLevel },
  }, 'case-sensitivity')

  return { partId }
}
