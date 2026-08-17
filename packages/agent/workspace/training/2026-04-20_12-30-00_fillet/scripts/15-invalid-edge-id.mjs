export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletInvalidEdge' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  // Test with completely invalid edge ID
  const r1 = await api.v1.part.fillet({
    id: partId,
    name: 'BadFillet1',
    references: [99999],
    radius: 10,
  })
  console.log('[15] invalid ID=99999 result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[15] messages:', JSON.stringify(r1.messages))
  filewrite({ test: 'invalid_id', result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'invalid-id')

  // Test with empty references array
  const r2 = await api.v1.part.fillet({
    id: partId,
    name: 'BadFillet2',
    references: [],
    radius: 10,
  })
  console.log('[15] empty refs result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[15] empty messages:', JSON.stringify(r2.messages))
  filewrite({ test: 'empty_refs', result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'empty-refs')

  // Test with face ID instead of edge ID
  const faceIds = (await api.v1.part.getGeometryIds({
    id: partId,
    surfaces: [{ pos: [40, 0, 20] }],  // front face
  })).result
  console.log('[15] face IDs:', JSON.stringify(faceIds.surfaces))

  if (faceIds.surfaces?.length) {
    const r3 = await api.v1.part.fillet({
      id: partId,
      name: 'BadFillet3',
      references: faceIds.surfaces,
      radius: 10,
    })
    console.log('[15] face ID result:', r3.result, 'maxLevel:', r3.maxLevel)
    if (r3.messages?.length) console.log('[15] face messages:', JSON.stringify(r3.messages))
    filewrite({ test: 'face_id', result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'face-id')
  }

  return { partId }
}
