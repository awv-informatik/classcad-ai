// 01: Basic fillet — rectangle, fillet one corner with offset
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'FilletTest' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  // Rectangle 100x80
  const lines = (await execute({ 'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [100, 80, 0] }] })).result
  console.log('Rectangle lines:', lines)
  await snapshot('before-fillet')

  // Fillet first corner (line[0] + line[1]) with offset=10
  const filletRes = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[0], lines[1]], offset: 10 }] })
  console.log('Fillet result:', JSON.stringify(filletRes))
  await snapshot('after-fillet-offset10')

  return { skId, lines, filletResult: filletRes.result }
}
