// 03 — genFixation behavior: at origin vs off-origin, TRUE vs FALSE
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FixTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Arc with center at origin, genFixation=TRUE (default)
  const r1 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-20, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [20, 0, 0],
  })
  const id1 = r1.result
  console.log('[03] arc at origin, genFix=default:', id1)

  // Arc with center OFF origin, genFixation=TRUE (default)
  const r2 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [30, 50, 0],
    centerPos: [50, 50, 0],
    endPos: [70, 50, 0],
  })
  const id2 = r2.result
  console.log('[03] arc off origin, genFix=default:', id2)

  // Arc with center at origin, genFixation=FALSE
  const r3 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-20, -50, 0],
    centerPos: [0, -50, 0],
    endPos: [20, -50, 0],
    genFixation: false,
  })
  const id3 = r3.result
  console.log('[03] arc, genFix=false:', id3)

  // Dump structure to see constraints
  filewrite(r1.structure, 'structure-after-all')

  await snapshot('genFixation')
  return { partId }
}
