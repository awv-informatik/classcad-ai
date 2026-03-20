// 04: Both offset and radius set — verify offset takes priority
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'OffsetPrio' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  const lines = (await execute({ 'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [100, 80, 0] }] })).result

  // offset=10, radius=50 — if offset wins, arc should be small (offset=10 at 90° → radius=10)
  const res = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[0], lines[1]], offset: 10, radius: 50 }] })
  console.log('Both set:', JSON.stringify(res))

  if (res.result) {
    const arcGeo = await execute({ 'v1.sketch.getGeometry': [{ id: res.result[0] }] })
    console.log('Arc geometry (expect r≈10):', JSON.stringify(arcGeo))
  }
  await snapshot('offset-priority')

  return { filletResult: res.result }
}
