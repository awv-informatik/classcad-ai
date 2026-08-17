// Q: What JS type are IDs? What's the gap pattern from part.create → box → box?
export default async function (api) {
  const r1 = await api.v1.part.create({ name: 'TestPart' })
  const partId = r1.result
  console.log('[01] partId:', partId, 'type:', typeof partId, 'isInteger:', Number.isInteger(partId))

  const r2 = await api.v1.part.box({ id: partId, name: 'Box1' })
  const boxId = r2.result
  console.log('[01] boxId:', boxId, 'type:', typeof boxId, 'gap from part:', boxId - partId)

  const r3 = await api.v1.part.box({ id: partId, name: 'Box2' })
  const box2Id = r3.result
  console.log('[01] box2Id:', box2Id, 'type:', typeof box2Id, 'gap from box1:', box2Id - boxId)

  // Check a sketch create for another domain
  const r4 = await api.v1.sketch.create({ id: partId })
  const sketchId = r4.result
  console.log('[01] sketchId:', sketchId, 'gap from box2:', sketchId - box2Id)
}
