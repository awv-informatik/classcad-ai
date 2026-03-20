// 05: Sequential filleting — all 4 corners of rectangle
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'SeqFillet' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  const lines = (await execute({ 'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [100, 80, 0] }] })).result
  // lines = [l0, l1, l2, l3] forming rectangle corners: l0-l1, l1-l2, l2-l3, l3-l0

  const f1 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[0], lines[1]], offset: 10 }] })
  console.log('Corner 1:', f1.result ? 'OK' : 'FAIL', f1.messages)
  await snapshot('after-corner1')

  const f2 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[1], lines[2]], offset: 10 }] })
  console.log('Corner 2:', f2.result ? 'OK' : 'FAIL', f2.messages)

  const f3 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[2], lines[3]], offset: 10 }] })
  console.log('Corner 3:', f3.result ? 'OK' : 'FAIL', f3.messages)

  const f4 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[3], lines[0]], offset: 10 }] })
  console.log('Corner 4:', f4.result ? 'OK' : 'FAIL', f4.messages)

  await snapshot('all-4-corners')

  return { corners: [f1.result, f2.result, f3.result, f4.result] }
}
