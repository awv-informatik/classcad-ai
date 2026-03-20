// 03: Default fillet (no offset, no radius)
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'FilletDefault' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  // Rectangle 100x60 — shortest line is 60, so default offset should be 60/4 = 15
  const lines = (await execute({ 'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [100, 60, 0] }] })).result

  const res = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[0], lines[1]] }] })
  console.log('Default fillet:', JSON.stringify(res))
  await snapshot('fillet-default')

  // Get geometry to check arc dimensions
  if (res.result) {
    const arcGeo = await execute({ 'v1.sketch.getGeometry': [{ id: res.result[0] }] })
    console.log('Arc geometry:', JSON.stringify(arcGeo))
  }

  return { filletResult: res.result }
}
