// 15 — Deeper investigation of keepTools behavior.
// Compare graphic containers and face counts with keepTools=true vs default.
// The question: does keepTools change the merge topology, or just face colors?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'KeepToolsDetail' })).result

  // --- keepTools=false (default) ---
  const eif1 = (await api.v1.part.entityInjection({ id: partId })).result
  const a1 = (await api.v1.solid.box({ id: eif1, length: 100, width: 60, height: 40 })).result
  const a2 = (await api.v1.solid.box({ id: eif1, length: 60, width: 40, height: 80, translation: [60, 30, 0] })).result

  const r1 = await api.v1.solid.merge({ id: eif1, target: a1, tools: [a2] })
  console.log('[15] keepTools=false:')
  console.log('[15]   result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.graphic && r1.graphic.containers) {
    console.log('[15]   containers:', r1.graphic.containers.length)
    for (const c of r1.graphic.containers) {
      console.log('[15]   container', c.id, ': meshes=', c.meshes?.length, 'edges=', c.edges?.length)
    }
  }

  // --- keepTools=true ---
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result
  const b1 = (await api.v1.solid.box({ id: eif2, length: 100, width: 60, height: 40, translation: [0, 0, 120] })).result
  const b2 = (await api.v1.solid.box({ id: eif2, length: 60, width: 40, height: 80, translation: [60, 30, 120] })).result

  const r2 = await api.v1.solid.merge({ id: eif2, target: b1, tools: [b2], keepTools: true })
  console.log('[15] keepTools=true:')
  console.log('[15]   result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.graphic && r2.graphic.containers) {
    console.log('[15]   containers:', r2.graphic.containers.length)
    for (const c of r2.graphic.containers) {
      console.log('[15]   container', c.id, ': meshes=', c.meshes?.length, 'edges=', c.edges?.length)
    }
  }

  // Try to copy b2 (the tool) — should this work with keepTools=true?
  const copyR = await api.v1.solid.copy({ id: eif2, solid: b2 })
  console.log('[15]   copy tool (keepTools=true):', copyR.result, 'maxLevel:', copyR.maxLevel)
  if (copyR.messages?.length) console.log('[15]   copy msgs:', JSON.stringify(copyR.messages))

  await snapshot('comparison')

  return { partId }
}
