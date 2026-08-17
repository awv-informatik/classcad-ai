// Test setReferences — planeId with work plane and face, invertPlane
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SetRefPlane' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  // Create work planes
  const wp1 = (await api.v1.part.workPlane({
    id: partId, name: 'WP_Z50',
    origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0]
  })).result

  // Get a face from the box
  const geo = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }]  // top face
  })
  const topFaceId = geo.result.planes[0]
  console.log('[08] wp1:', wp1, 'topFaceId:', topFaceId)

  // Create a sketch with no planeId
  const sk1 = (await api.v1.sketch.create({ id: partId, name: 'Sk1' })).result
  console.log('[08] sk1 (no planeId):', sk1)

  // Draw a line in the sketch to see if setReferences moves it
  const line1 = (await api.v1.sketch.line({ id: sk1, startPos: [0, 0, 0], endPos: [50, 30, 0] })).result
  const posBefore = await api.v1.sketch.getPositions({ id: line1 })
  console.log('[08] line position before setReferences:', JSON.stringify(posBefore.result))

  // setReferences with work plane
  const sr1 = await api.v1.sketch.setReferences({ id: sk1, planeId: wp1 })
  console.log('[08] setReferences (WP) — result:', sr1.result, 'maxLevel:', sr1.maxLevel, 'messages:', JSON.stringify(sr1.messages))
  filewrite({ result: sr1.result, messages: sr1.messages, maxLevel: sr1.maxLevel }, 'setref-wp')

  const posAfterWP = await api.v1.sketch.getPositions({ id: line1 })
  console.log('[08] line position after setReferences(WP):', JSON.stringify(posAfterWP.result))

  // setReferences with face
  const sr2 = await api.v1.sketch.setReferences({ id: sk1, planeId: topFaceId })
  console.log('[08] setReferences (face) — result:', sr2.result, 'maxLevel:', sr2.maxLevel, 'messages:', JSON.stringify(sr2.messages))
  filewrite({ result: sr2.result, messages: sr2.messages, maxLevel: sr2.maxLevel }, 'setref-face')

  const posAfterFace = await api.v1.sketch.getPositions({ id: line1 })
  console.log('[08] line position after setReferences(face):', JSON.stringify(posAfterFace.result))

  // setReferences with invertPlane
  const sr3 = await api.v1.sketch.setReferences({ id: sk1, planeId: wp1, invertPlane: 1 })
  console.log('[08] setReferences (invertPlane) — result:', sr3.result, 'maxLevel:', sr3.maxLevel, 'messages:', JSON.stringify(sr3.messages))
  filewrite({ result: sr3.result, messages: sr3.messages, maxLevel: sr3.maxLevel }, 'setref-invert')

  filewrite({
    before: posBefore.result,
    afterWP: posAfterWP.result,
    afterFace: posAfterFace.result
  }, 'positions-comparison')

  await snapshot('setref-plane')
  return { partId }
}
