// 04 — Offset on a sphere (simple topology, no edges to fillet)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereOffset' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create sphere + reference body
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 20 })).result
  const refId = (await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10, translation: [50, 0, 0] })).result
  console.log('[04] sphId:', sphId, 'refId:', refId)

  await snapshot('before')

  const r = await api.v1.solid.offset({ id: eifId, target: sphId, distance: 5 })
  console.log('[04] sphere offset result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'sphere-offset-response')

  await snapshot('after')

  return { sphId, result: r.result }
}
