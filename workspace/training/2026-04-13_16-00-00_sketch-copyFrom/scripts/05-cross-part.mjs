// Test copyFrom between sketches in different parts (if possible)
// and also test passing a part ID instead of sketch ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Part1' })).result
  const sk1 = (await api.v1.sketch.create({ id: partId })).result
  await api.v1.sketch.rectangle({ id: sk1, startPos: [0, 0, 0], endPos: [30, 20, 0] })

  // part.create clears drawing, so we can't have two parts simultaneously.
  // Instead, test: what if we pass the partId as toCopyId?
  const sk2 = (await api.v1.sketch.create({ id: partId })).result

  const r1 = await api.v1.sketch.copyFrom({ id: sk2, toCopyId: partId })
  console.log('[05] toCopyId=partId result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[05] toCopyId=partId messages:', JSON.stringify(r1.messages))

  // What if id=partId (dest is a part, not a sketch)?
  const r2 = await api.v1.sketch.copyFrom({ id: partId, toCopyId: sk1 })
  console.log('[05] id=partId result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[05] id=partId messages:', JSON.stringify(r2.messages))

  filewrite({
    toCopyIdAsPart: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    idAsPart: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  }, 'wrong-type-ids')

  return { partId }
}
