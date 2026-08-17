// Test setReferences — axis and origin parameters
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SetRefAxis' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  // Create work geometry for references
  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'WA1',
    origin: [0, 0, 0], direction: [1, 1, 0]  // 45-degree axis
  })).result
  const wpId = (await api.v1.part.workPlane({
    id: partId, name: 'WP_Top',
    origin: [0, 0, 40], normal: [0, 0, 1], xDirection: [1, 0, 0]
  })).result
  const wptId = (await api.v1.part.workPoint({
    id: partId, name: 'WPt1',
    position: [20, 10, 40]
  })).result
  console.log('[09] waId:', waId, 'wpId:', wpId, 'wptId:', wptId)

  // Create sketch on default plane with no references
  const skId = (await api.v1.sketch.create({ id: partId, name: 'AxisSketch' })).result
  console.log('[09] sketchId:', skId)

  // Draw a line to track coordinate changes
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [60, 40, 0] })).result

  // setReferences with just planeId
  const sr1 = await api.v1.sketch.setReferences({ id: skId, planeId: wpId })
  console.log('[09] setRef plane only — maxLevel:', sr1.maxLevel)
  const pos1 = await api.v1.sketch.getPositions({ id: lineId })
  console.log('[09] after plane:', JSON.stringify(pos1.result))

  // setReferences with axisId
  const sr2 = await api.v1.sketch.setReferences({ id: skId, planeId: wpId, axisId: waId })
  console.log('[09] setRef plane+axis — maxLevel:', sr2.maxLevel, 'messages:', JSON.stringify(sr2.messages))
  filewrite({ result: sr2.result, messages: sr2.messages, maxLevel: sr2.maxLevel }, 'setref-axis')
  const pos2 = await api.v1.sketch.getPositions({ id: lineId })
  console.log('[09] after plane+axis:', JSON.stringify(pos2.result))

  // setReferences with isXAxis: FALSE (axis becomes y-axis direction instead)
  const sr3 = await api.v1.sketch.setReferences({ id: skId, planeId: wpId, axisId: waId, isXAxis: 0 })
  console.log('[09] setRef isXAxis=FALSE — maxLevel:', sr3.maxLevel, 'messages:', JSON.stringify(sr3.messages))
  filewrite({ result: sr3.result, messages: sr3.messages, maxLevel: sr3.maxLevel }, 'setref-isxaxis-false')
  const pos3 = await api.v1.sketch.getPositions({ id: lineId })
  console.log('[09] after isXAxis=FALSE:', JSON.stringify(pos3.result))

  // setReferences with originId (work point)
  const sr4 = await api.v1.sketch.setReferences({ id: skId, planeId: wpId, originId: wptId })
  console.log('[09] setRef plane+origin — maxLevel:', sr4.maxLevel, 'messages:', JSON.stringify(sr4.messages))
  filewrite({ result: sr4.result, messages: sr4.messages, maxLevel: sr4.maxLevel }, 'setref-origin')
  const pos4 = await api.v1.sketch.getPositions({ id: lineId })
  console.log('[09] after plane+origin:', JSON.stringify(pos4.result))

  // setReferences with all params
  const sr5 = await api.v1.sketch.setReferences({
    id: skId, planeId: wpId, axisId: waId, isXAxis: 1, originId: wptId
  })
  console.log('[09] setRef all params — maxLevel:', sr5.maxLevel, 'messages:', JSON.stringify(sr5.messages))
  filewrite({ result: sr5.result, messages: sr5.messages, maxLevel: sr5.maxLevel }, 'setref-all')
  const pos5 = await api.v1.sketch.getPositions({ id: lineId })
  console.log('[09] after all params:', JSON.stringify(pos5.result))

  filewrite({
    afterPlane: pos1.result,
    afterPlaneAxis: pos2.result,
    afterIsXAxisFalse: pos3.result,
    afterPlaneOrigin: pos4.result,
    afterAll: pos5.result
  }, 'positions-comparison')

  return { partId }
}
