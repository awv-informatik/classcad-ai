export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletNoRecalc' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  // Deliberately skip recalc — test if fillet has the same gotcha as chamfer
  // Chamfer training showed: pre-recalc IDs work for EQUAL_DISTANCE but fail for TWO_DISTANCES/DISTANCE_ANGLE

  const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  console.log('[05] pre-recalc edge IDs:', JSON.stringify(geoIds.lines))

  // Try fillet without recalc
  const r = await api.v1.part.fillet({
    id: partId,
    name: 'NoRecalcFillet',
    references: geoIds.lines,
    radius: 10,
  })
  console.log('[05] fillet result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[05] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel, edgeIds: geoIds.lines }, 'no-recalc-response')

  await snapshot('no-recalc')

  return { partId, filletId: r.result }
}
