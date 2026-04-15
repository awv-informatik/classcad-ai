// 07 — Merge with keepTools: true. Verify tool solid remains valid after merge.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'KeepTools' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })).result
  const box2 = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 80,
    translation: [60, 30, 0]
  })).result

  const r = await api.v1.solid.merge({ id: eifId, target: box1, tools: [box2], keepTools: true })
  console.log('[07] merge keepTools result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] merge msgs:', JSON.stringify(r.messages))

  // Check: how many containers now? (merge result + kept tool = 2?)
  if (r.graphic && r.graphic.containers) {
    console.log('[07] containers after merge:', r.graphic.containers.length)
    for (const c of r.graphic.containers) {
      console.log('[07]   container id:', c.id, 'meshes:', c.meshes?.length, 'edges:', c.edges?.length)
    }
  }

  await snapshot('after-merge-keeptools')

  // Verify box2 is still valid — try to copy it
  const copyR = await api.v1.solid.copy({ id: eifId, solid: box2 })
  console.log('[07] copy box2 result:', copyR.result, 'maxLevel:', copyR.maxLevel)

  // Also try to translate box2 — still works?
  const transR = await api.v1.solid.translation({ id: eifId, solid: box2, vector: [0, 0, 50] })
  console.log('[07] translate box2 result:', transR.result, 'maxLevel:', transR.maxLevel)

  await snapshot('after-translate-tool')

  return { partId }
}
