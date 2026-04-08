// Test sketch.geometry — genFixation flag comparison
// Dump structure trees to compare constraint counts
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result

  // Sketch A: default genFixation (TRUE)
  const skA = (await api.v1.sketch.create({ id: partId })).result
  const rA = await api.v1.sketch.geometry({
    id: skA,
    lines: [{ startPos: [0, 0, 0], endPos: [50, 0, 0] }],
  })
  console.log('[08a] default genFixation result:', JSON.stringify(rA.result))
  console.log('[08a] maxLevel:', rA.maxLevel)
  filewrite(rA.structure, 'fixation-default-structure')

  // Sketch B: genFixation = false
  const skB = (await api.v1.sketch.create({ id: partId })).result
  const rB = await api.v1.sketch.geometry({
    id: skB,
    lines: [{ startPos: [0, 0, 0], endPos: [50, 0, 0] }],
    genFixation: false,
  })
  console.log('[08b] genFixation=false result:', JSON.stringify(rB.result))
  console.log('[08b] maxLevel:', rB.maxLevel)
  filewrite(rB.structure, 'fixation-off-structure')

  return { partId }
}
