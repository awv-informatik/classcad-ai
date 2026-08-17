// Test FIXATION constraint: on points vs curves, effect on subsequent constraints
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Fix a single point
  const pt = (await api.v1.sketch.point({ id: skId, pos: [20, 30, 0], genFixation: false })).result
  const rFP = await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pt] })
  console.log('[08] FIXATION on point result:', rFP.result, 'maxLevel:', rFP.maxLevel)

  // Fix an entire line (both endpoints?)
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const rFL = await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })
  console.log('[08] FIXATION on line result:', rFL.result, 'maxLevel:', rFL.maxLevel)

  // Now try to make the fixed line vertical — should this create a conflict?
  const l1Before = await getLinePositions(api, l1)
  const rV = await api.v1.sketch.constraint({ id: skId, type: 'VERTICAL', geomIds: [l1] })
  console.log('[08] VERTICAL on fixed line result:', rV.result, 'maxLevel:', rV.maxLevel)
  if (rV.messages?.length) console.log('[08] messages:', JSON.stringify(rV.messages))

  const l1After = await getLinePositions(api, l1)
  console.log('[08] fixed line BEFORE vertical:', l1Before)
  console.log('[08] fixed line AFTER vertical:', l1After)

  // Fix a circle
  const c1 = (await api.v1.sketch.circle({
    id: skId, center: [0, 60, 0], radius: 20,
    genFixation: false,
  })).result
  const rFC = await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [c1] })
  console.log('[08] FIXATION on circle result:', rFC.result, 'maxLevel:', rFC.maxLevel)

  filewrite({
    fixPoint: { result: rFP.result, maxLevel: rFP.maxLevel },
    fixLine: { result: rFL.result, maxLevel: rFL.maxLevel },
    verticalOnFixed: {
      before: l1Before, after: l1After,
      result: rV.result, maxLevel: rV.maxLevel,
      messages: rV.messages,
    },
    fixCircle: { result: rFC.result, maxLevel: rFC.maxLevel },
  }, 'fixation-data')

  await snapshot('result')
  return { partId }
}

async function getLinePositions(api, lineId) {
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const startPos = (await api.v1.sketch.getPositions({ id: pts.startId })).result
  const endPos = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  return { start: startPos, end: endPos }
}
