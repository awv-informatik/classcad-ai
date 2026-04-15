// 09 — Merge with empty tools array. Does it succeed silently like union?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyTools' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })).result

  const r = await api.v1.solid.merge({ id: eifId, target: box1, tools: [] })
  console.log('[09] empty tools result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] msgs:', JSON.stringify(r.messages))

  // Count meshes to confirm nothing changed
  if (r.graphic && r.graphic.containers) {
    for (const c of r.graphic.containers) {
      console.log('[09] container', c.id, ': meshes=', c.meshes?.length)
    }
  }

  await snapshot('empty-tools')

  return { partId }
}
