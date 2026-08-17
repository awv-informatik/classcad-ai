export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SequentialTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})
  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result

  const filletId = (await api.v1.part.fillet({
    id: partId,
    name: 'SeqFillet',
    references: edges.lines,
    radius: 5,
  })).result
  console.log('[08] filletId:', filletId)

  const results = []

  // Update 1: radius 5 → 10
  await api.v1.part.openFeature({ id: filletId })
  const r1 = await api.v1.part.updateFillet({ id: filletId, radius: 10 })
  results.push({ step: 1, result: r1.result, maxLevel: r1.maxLevel })
  console.log('[08] update1 — result:', r1.result, 'maxLevel:', r1.maxLevel)
  await api.v1.part.closeFeature({ id: filletId })

  // Update 2: radius 10 → 18 + rename
  await api.v1.part.openFeature({ id: filletId })
  const r2 = await api.v1.part.updateFillet({ id: filletId, radius: 18, name: 'BiggerFillet' })
  results.push({ step: 2, result: r2.result, maxLevel: r2.maxLevel })
  console.log('[08] update2 — result:', r2.result, 'maxLevel:', r2.maxLevel)
  await api.v1.part.closeFeature({ id: filletId })

  // Update 3: radius 18 → 3
  await api.v1.part.openFeature({ id: filletId })
  const r3 = await api.v1.part.updateFillet({ id: filletId, radius: 3 })
  results.push({ step: 3, result: r3.result, maxLevel: r3.maxLevel })
  console.log('[08] update3 — result:', r3.result, 'maxLevel:', r3.maxLevel)
  await api.v1.part.closeFeature({ id: filletId })

  filewrite(results, 'sequential-results')
  await snapshot('after-3-updates')
  return { filletId }
}
