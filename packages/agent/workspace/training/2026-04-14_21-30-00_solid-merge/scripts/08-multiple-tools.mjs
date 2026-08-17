// 08 — Merge with multiple tools in a single call.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiTools' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 50, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 60, translation: [60, 20, 0] })).result
  const box3 = (await api.v1.solid.box({ id: eifId, length: 30, width: 60, height: 40, translation: [-40, 10, 0] })).result

  console.log('[08] box1:', box1, 'box2:', box2, 'box3:', box3)
  await snapshot('before')

  const r = await api.v1.solid.merge({ id: eifId, target: box1, tools: [box2, box3] })
  console.log('[08] merge 3 solids result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] msgs:', JSON.stringify(r.messages))

  if (r.graphic && r.graphic.containers) {
    for (const c of r.graphic.containers) {
      console.log('[08] container', c.id, ': meshes=', c.meshes?.length, 'edges=', c.edges?.length)
    }
  }

  await snapshot('after')

  // Verify tool solids are consumed
  const copy2 = await api.v1.solid.copy({ id: eifId, solid: box2 })
  const copy3 = await api.v1.solid.copy({ id: eifId, solid: box3 })
  console.log('[08] copy box2:', copy2.result, 'maxLevel:', copy2.maxLevel)
  console.log('[08] copy box3:', copy3.result, 'maxLevel:', copy3.maxLevel)

  return { partId }
}
