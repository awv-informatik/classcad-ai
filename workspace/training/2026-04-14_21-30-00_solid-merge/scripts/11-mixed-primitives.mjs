// 11 — Merge mixed primitives: box + cylinder + sphere. Verify all faces combined.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MixedMerge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box = (await api.v1.solid.box({ id: eifId, length: 80, width: 50, height: 30 })).result
  const cyl = (await api.v1.solid.cylinder({ id: eifId, diameter: 40, height: 60, translation: [100, 25, 0] })).result
  const sph = (await api.v1.solid.sphere({ id: eifId, radius: 25, translation: [-40, 25, 15] })).result

  console.log('[11] box:', box, 'cyl:', cyl, 'sph:', sph)
  await snapshot('before')

  const r = await api.v1.solid.merge({ id: eifId, target: box, tools: [cyl, sph] })
  console.log('[11] merge result:', r.result, 'maxLevel:', r.maxLevel)

  if (r.graphic && r.graphic.containers) {
    console.log('[11] containers:', r.graphic.containers.length)
    for (const c of r.graphic.containers) {
      console.log('[11]   container', c.id, ': meshes=', c.meshes?.length, 'edges=', c.edges?.length)
    }
  }

  await snapshot('after')

  return { partId }
}
