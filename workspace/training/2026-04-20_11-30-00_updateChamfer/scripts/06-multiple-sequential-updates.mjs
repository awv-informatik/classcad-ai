export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SeqUpdateTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  const edgeId = edges.lines[0]

  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    references: [edgeId],
    distance1: 5,
  })).result
  console.log('[06] chamferId:', chamferId)

  // Update 1: change distance
  await api.v1.part.openFeature({ id: chamferId })
  const r1 = await api.v1.part.updateChamfer({ id: chamferId, distance1: 10 })
  console.log('[06] update1 (d=10) — result:', r1.result, 'maxLevel:', r1.maxLevel)
  await api.v1.part.closeFeature({ id: chamferId })

  // Update 2: change type
  await api.v1.part.openFeature({ id: chamferId })
  const r2 = await api.v1.part.updateChamfer({ id: chamferId, type: 'TWO_DISTANCES', distance1: 5, distance2: 15 })
  console.log('[06] update2 (TWO_DIST) — result:', r2.result, 'maxLevel:', r2.maxLevel)
  await api.v1.part.closeFeature({ id: chamferId })

  // Update 3: change back + rename
  await api.v1.part.openFeature({ id: chamferId })
  const r3 = await api.v1.part.updateChamfer({ id: chamferId, type: 'EQUAL_DISTANCE', distance1: 15, name: 'BigChamfer' })
  console.log('[06] update3 (EQUAL_DIST d=15 rename) — result:', r3.result, 'maxLevel:', r3.maxLevel)
  await api.v1.part.closeFeature({ id: chamferId })

  filewrite({ u1: { result: r1.result, maxLevel: r1.maxLevel }, u2: { result: r2.result, maxLevel: r2.maxLevel }, u3: { result: r3.result, maxLevel: r3.maxLevel } }, 'sequential-results')
  await snapshot('after-3-updates')

  return { chamferId }
}
