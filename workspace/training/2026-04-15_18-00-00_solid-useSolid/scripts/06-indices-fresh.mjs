// 06 — Test indices on a fresh (not previously consumed) entity injection
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IndicesFresh' })).result

  // Create source EI with 3 distinct solids
  const srcEif = (await api.v1.part.entityInjection({ id: partId, name: 'Source' })).result
  const box1 = (await api.v1.solid.box({ id: srcEif, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: srcEif, length: 30, width: 30, height: 50, translation: [80, 0, 0] })).result
  const cyl = (await api.v1.solid.cylinder({ id: srcEif, height: 40, diameter: 25, translation: [0, 70, 0] })).result
  console.log('[06] source solids: box1:', box1, 'box2:', box2, 'cyl:', cyl)

  // Use indices [0] on fresh source — select only the first solid
  const dstEif = (await api.v1.part.entityInjection({ id: partId, name: 'Dest' })).result
  const r = await api.v1.solid.useSolid({ from: [{ id: srcEif, indices: [0] }], in: dstEif })
  console.log('[06] useSolid indices [0] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'indices-0-fresh')

  await snapshot('indices-fresh')
  return { r: r.result }
}
