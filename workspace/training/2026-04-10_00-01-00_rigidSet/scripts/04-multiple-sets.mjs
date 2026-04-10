// 04 — Multiple rigid sets in one sketch, shared geometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultipleSets' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [40, 0, 0], endPos: [40, 30, 0] })).result
  const line3 = (await api.v1.sketch.line({ id: skId, startPos: [60, 0, 0], endPos: [100, 0, 0] })).result

  // Create two separate rigid sets
  const rs1 = await api.v1.sketch.rigidSet({ id: skId, geomIds: [line1, line2] })
  console.log('[04] rigidSet1 — result:', rs1.result, 'maxLevel:', rs1.maxLevel)

  const rs2 = await api.v1.sketch.rigidSet({ id: skId, geomIds: [line3] })
  console.log('[04] rigidSet2 — result:', rs2.result, 'maxLevel:', rs2.maxLevel)

  // Try to create a third rigid set that shares geometry with rs1 (line1)
  const rs3 = await api.v1.sketch.rigidSet({ id: skId, geomIds: [line1, line3] })
  console.log('[04] rigidSet3 (shared geom) — result:', rs3.result, 'maxLevel:', rs3.maxLevel)
  console.log('[04] rigidSet3 messages:', JSON.stringify(rs3.messages))

  filewrite({
    rs1: { result: rs1.result, maxLevel: rs1.maxLevel },
    rs2: { result: rs2.result, maxLevel: rs2.maxLevel },
    rs3: { result: rs3.result, messages: rs3.messages, maxLevel: rs3.maxLevel }
  }, 'multiple-sets')

  await snapshot('multiple')
  return { partId }
}
