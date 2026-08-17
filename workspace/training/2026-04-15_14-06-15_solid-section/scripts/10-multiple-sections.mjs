// 10 — Multiple sections on the same solid
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionMultiple' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Three sections at different heights
  const r1 = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, -10],
    normal: [0, 0, 1],
  })
  console.log('[10] section1 (z=-10):', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
  })
  console.log('[10] section2 (z=0):', r2.result, 'maxLevel:', r2.maxLevel)

  const r3 = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 10],
    normal: [0, 0, 1],
  })
  console.log('[10] section3 (z=10):', r3.result, 'maxLevel:', r3.maxLevel)

  // Also try a vertical section (XZ plane)
  const r4 = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 1, 0],
  })
  console.log('[10] section4 (y=0):', r4.result, 'maxLevel:', r4.maxLevel)

  // Check that all are different IDs
  console.log('[10] all IDs:', [r1.result, r2.result, r3.result, r4.result])

  // Dump final graphic to see all sections
  filewrite(r4.graphic, 'graphic-final')

  // Count all curve containers
  const containers = r4.graphic?.containers || []
  console.log('[10] total containers:', containers.length)
  for (const c of containers) {
    console.log('[10]  id:', c.id, 'type:', c.type, 'edges:', c.edges?.length || 0)
  }

  await snapshot('all-sections')

  return { partId, eifId, boxId, ids: [r1.result, r2.result, r3.result, r4.result] }
}
