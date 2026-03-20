// 02: Fillet with radius instead of offset
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'FilletRadius' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  const lines = (await execute({ 'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [100, 80, 0] }] })).result

  // Fillet with radius=15
  const res = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[0], lines[1]], radius: 15 }] })
  console.log('Fillet radius=15:', JSON.stringify(res))
  await snapshot('fillet-radius15')

  return { filletResult: res.result }
}
