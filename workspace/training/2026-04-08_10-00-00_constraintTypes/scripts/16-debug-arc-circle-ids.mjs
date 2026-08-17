// Debug: what IDs do arcByCenter and circle return? Why do constraints reject them?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line first (known working)
  const lineR = await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })
  console.log('[16] line result:', lineR.result, 'type:', typeof lineR.result)

  // Create a circle
  const circR = await api.v1.sketch.circle({
    id: skId, center: [0, 50, 0], radius: 20,
    genFixation: false,
  })
  console.log('[16] circle result:', circR.result, 'type:', typeof circR.result)
  console.log('[16] circle maxLevel:', circR.maxLevel)
  if (circR.messages?.length) console.log('[16] circle msgs:', JSON.stringify(circR.messages))

  // Create an arc
  const arcR = await api.v1.sketch.arcByCenter({
    id: skId, center: [60, 50, 0], startPos: [40, 50, 0], endPos: [80, 50, 0],
    genFixation: false, genVertAndHoriz: false,
  })
  console.log('[16] arc result:', arcR.result, 'type:', typeof arcR.result)
  console.log('[16] arc maxLevel:', arcR.maxLevel)
  if (arcR.messages?.length) console.log('[16] arc msgs:', JSON.stringify(arcR.messages))

  // getPoints on all three
  const linePts = await api.v1.sketch.getPoints({ id: lineR.result })
  const circPts = await api.v1.sketch.getPoints({ id: circR.result })
  const arcPts = await api.v1.sketch.getPoints({ id: arcR.result })
  console.log('[16] line getPoints:', linePts.result)
  console.log('[16] circle getPoints:', circPts.result, 'maxLevel:', circPts.maxLevel)
  console.log('[16] arc getPoints:', arcPts.result, 'maxLevel:', arcPts.maxLevel)

  // Try FIXATION on each
  const fixLine = await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [lineR.result] })
  console.log('[16] FIXATION line:', fixLine.result, 'maxLevel:', fixLine.maxLevel)

  const fixCirc = await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [circR.result] })
  console.log('[16] FIXATION circle:', fixCirc.result, 'maxLevel:', fixCirc.maxLevel)
  if (fixCirc.messages?.length) console.log('[16] fix circ msgs:', JSON.stringify(fixCirc.messages))

  const fixArc = await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [arcR.result] })
  console.log('[16] FIXATION arc:', fixArc.result, 'maxLevel:', fixArc.maxLevel)
  if (fixArc.messages?.length) console.log('[16] fix arc msgs:', JSON.stringify(fixArc.messages))

  // Dump the structure to see what objects exist
  const struct = (await api.v1.common.getStructure({ id: skId })).result
  filewrite(struct, 'sketch-structure')

  return { partId }
}
