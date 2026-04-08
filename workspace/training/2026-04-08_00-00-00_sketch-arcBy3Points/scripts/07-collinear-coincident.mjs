// Edge cases: collinear points, coincident points
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Case A: Collinear points (all on X axis)
  const rA = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 0, 0],
    midPos: [20, 0, 0],
    endPos: [40, 0, 0],
  })
  console.log('[07] Collinear:', rA.result, 'maxLevel:', rA.maxLevel)
  console.log('[07] Collinear msgs:', JSON.stringify(rA.messages))

  // Case B: start == mid
  const rB = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 0, 0],
    midPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })
  console.log('[07] start==mid:', rB.result, 'maxLevel:', rB.maxLevel)
  console.log('[07] start==mid msgs:', JSON.stringify(rB.messages))

  // Case C: start == end
  const rC = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 0, 0],
    midPos: [20, 20, 0],
    endPos: [0, 0, 0],
  })
  console.log('[07] start==end:', rC.result, 'maxLevel:', rC.maxLevel)
  console.log('[07] start==end msgs:', JSON.stringify(rC.messages))

  // Case D: all three identical
  const rD = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [10, 10, 0],
    midPos: [10, 10, 0],
    endPos: [10, 10, 0],
  })
  console.log('[07] all equal:', rD.result, 'maxLevel:', rD.maxLevel)
  console.log('[07] all equal msgs:', JSON.stringify(rD.messages))

  filewrite({
    collinear: { result: rA.result, maxLevel: rA.maxLevel, messages: rA.messages },
    startEqMid: { result: rB.result, maxLevel: rB.maxLevel, messages: rB.messages },
    startEqEnd: { result: rC.result, maxLevel: rC.maxLevel, messages: rC.messages },
    allEqual: { result: rD.result, maxLevel: rD.maxLevel, messages: rD.messages },
  }, 'edge-cases')

  return { partId }
}
