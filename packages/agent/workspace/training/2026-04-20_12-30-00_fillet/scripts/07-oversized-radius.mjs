export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletOversized' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  console.log('[07] edge IDs:', JSON.stringify(geoIds.lines))

  // Test 1: Radius just under the max (height=40, so max radius on this edge = 40)
  const r1 = await api.v1.part.fillet({
    id: partId,
    name: 'BigFillet',
    references: geoIds.lines,
    radius: 35,
  })
  console.log('[07] radius=35 result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[07] r=35 messages:', JSON.stringify(r1.messages))

  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'radius-35')

  await snapshot('radius-35')

  // Test 2: Radius exceeding geometry (should fail/degenerate like chamfer)
  // Delete the first fillet first by creating a fresh box
  // Actually, let's try radius=50 on a fresh setup
  // Need to create another part since the first has a fillet already
  const partId2 = (await api.v1.part.create({ name: 'FilletTooLarge' })).result
  const boxId2 = (await api.v1.part.box({ id: partId2, name: 'Box2', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  const geoIds2 = (await api.v1.part.getGeometryIds({ id: partId2, lines: [{ pos: [40, 0, 40] }] })).result

  const r2 = await api.v1.part.fillet({
    id: partId2,
    name: 'HugeFillet',
    references: geoIds2.lines,
    radius: 50,
  })
  console.log('[07] radius=50 result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[07] r=50 messages:', JSON.stringify(r2.messages))

  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'radius-50')

  await snapshot('radius-50')

  return { partId, partId2 }
}
