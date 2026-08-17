// 12 — Unnormalized normal vector (should work like normalized)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionUnnorm' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Same section as script 01 but with unnormalized normal
  const r = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 100],  // magnitude 100 instead of 1
  })

  console.log('[12] unnormalized result:', r.result, 'maxLevel:', r.maxLevel)

  // Check edges match the normalized case (4 edges forming a rectangle)
  const containers = r.graphic?.containers || []
  for (const c of containers) {
    if (c.edges) {
      console.log('[12] container edges:', c.edges.length)
      console.log('[12] bbox min:', JSON.stringify(c.properties?.min))
      console.log('[12] bbox max:', JSON.stringify(c.properties?.max))
    }
  }

  await snapshot('result')

  return { partId, eifId, boxId }
}
