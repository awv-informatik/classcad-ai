// Test SYMMETRY constraint with points and lines
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Symmetry axis: vertical line at x=40
  const axis = (await api.v1.sketch.line({
    id: skId, startPos: [40, -20, 0], endPos: [40, 60, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [axis] })

  // Two points — should be made symmetric about the axis
  const pt1 = (await api.v1.sketch.point({ id: skId, pos: [10, 20, 0], genFixation: false })).result
  const pt2 = (await api.v1.sketch.point({ id: skId, pos: [60, 25, 0], genFixation: false })).result

  const pt1Before = (await api.v1.sketch.getPositions({ id: pt1 })).result
  const pt2Before = (await api.v1.sketch.getPositions({ id: pt2 })).result
  console.log('[07] BEFORE sym pts — pt1:', pt1Before, 'pt2:', pt2Before)

  // SYMMETRY: axis FIRST, then the two objects
  const rSP = await api.v1.sketch.constraint({
    id: skId, type: 'SYMMETRY', geomIds: [axis, pt1, pt2],
  })
  console.log('[07] SYMMETRY points result:', rSP.result, 'maxLevel:', rSP.maxLevel)
  if (rSP.messages?.length) console.log('[07] messages:', JSON.stringify(rSP.messages))

  const pt1After = (await api.v1.sketch.getPositions({ id: pt1 })).result
  const pt2After = (await api.v1.sketch.getPositions({ id: pt2 })).result
  console.log('[07] AFTER sym pts — pt1:', pt1After, 'pt2:', pt2After)

  filewrite({
    symmetryPoints: {
      before: { pt1: pt1Before, pt2: pt2Before },
      after: { pt1: pt1After, pt2: pt2After },
      result: rSP.result,
    },
  }, 'symmetry-points')

  // Symmetry with two lines
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [10, 40, 0], endPos: [30, 50, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const l2 = (await api.v1.sketch.line({
    id: skId, startPos: [55, 42, 0], endPos: [70, 48, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  const l1Before = await getLinePositions(api, l1)
  const l2Before = await getLinePositions(api, l2)

  const rSL = await api.v1.sketch.constraint({
    id: skId, type: 'SYMMETRY', geomIds: [axis, l1, l2],
  })
  console.log('[07] SYMMETRY lines result:', rSL.result, 'maxLevel:', rSL.maxLevel)
  if (rSL.messages?.length) console.log('[07] line sym messages:', JSON.stringify(rSL.messages))

  const l1After = await getLinePositions(api, l1)
  const l2After = await getLinePositions(api, l2)
  console.log('[07] AFTER sym lines — l1:', l1After, 'l2:', l2After)

  filewrite({
    symmetryLines: {
      before: { l1: l1Before, l2: l2Before },
      after: { l1: l1After, l2: l2After },
      result: rSL.result,
    },
  }, 'symmetry-lines')

  await snapshot('result')
  return { partId }
}

async function getLinePositions(api, lineId) {
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const startPos = (await api.v1.sketch.getPositions({ id: pts.startId })).result
  const endPos = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  return { start: startPos, end: endPos }
}
