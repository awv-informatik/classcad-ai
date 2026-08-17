export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeEdgeDims' })).result

  // tDiameter = 0 (true cone point)
  const r1 = await api.v1.part.cone({ id: partId, name: 'TDZero', bDiameter: 50, tDiameter: 0, height: 80 })
  console.log('[05] tDiameter=0 result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[05] tDiameter=0 msgs:', JSON.stringify(r1.messages))

  // bDiameter = 0
  const r2 = await api.v1.part.cone({ id: partId, name: 'BDZero', bDiameter: 0, tDiameter: 20, height: 80 })
  console.log('[05] bDiameter=0 result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[05] bDiameter=0 msgs:', JSON.stringify(r2.messages))

  // height = 0
  const r3 = await api.v1.part.cone({ id: partId, name: 'HZero', bDiameter: 50, tDiameter: 10, height: 0 })
  console.log('[05] height=0 result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[05] height=0 msgs:', JSON.stringify(r3.messages))

  // negative dimensions
  const r4 = await api.v1.part.cone({ id: partId, name: 'Neg', bDiameter: -50, tDiameter: 10, height: 80 })
  console.log('[05] negative bD result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[05] negative bD msgs:', JSON.stringify(r4.messages))

  filewrite({
    tDZero: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    bDZero: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    hZero: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    negBD: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'edge-dims-response')

  await snapshot('edge-dims')
  return { partId }
}
