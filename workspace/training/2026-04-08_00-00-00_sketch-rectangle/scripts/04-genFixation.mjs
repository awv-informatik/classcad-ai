// 04 — genFixation: check constraint generation at origin vs off-origin
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FixTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Rectangle at origin with genFixation=TRUE (default)
  const r1 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [40, 30, 0],
  })
  console.log('[04] rect at origin, default genFixation — IDs:', r1.result)

  // Check constraints on points of line[0]
  const pts1 = await api.v1.sketch.getPoints({ id: r1.result[0] })
  console.log('[04] line[0] point IDs:', JSON.stringify(pts1.result))

  // Rectangle off-origin with genFixation=TRUE (default)
  const r2 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [60, 10, 0],
    endPos: [100, 40, 0],
  })
  console.log('[04] rect off-origin, default genFixation — IDs:', r2.result)

  // Rectangle at origin with genFixation=FALSE
  const r3 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 50, 0],
    endPos: [40, 80, 0],
    genFixation: 0, // FALSE
  })
  console.log('[04] rect at origin, genFixation=FALSE — IDs:', r3.result)

  // Dump structure to examine constraints
  const struct = (await api.v1.common.getAppVersion({})).structure
  filewrite(struct, 'structure')

  await snapshot('genFixation')
  return { partId }
}
