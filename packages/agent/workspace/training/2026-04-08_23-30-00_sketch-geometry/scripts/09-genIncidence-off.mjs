// Test sketch.geometry — genIncidence flag comparison
// Two lines sharing an endpoint — coincidence constraint should/shouldn't be auto-generated
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result

  // Sketch A: default genIncidence (TRUE)
  const skA = (await api.v1.sketch.create({ id: partId })).result
  const rA = await api.v1.sketch.geometry({
    id: skA,
    lines: [
      { startPos: [0, 0, 0], endPos: [30, 0, 0] },
      { startPos: [30, 0, 0], endPos: [30, 30, 0] },
    ],
  })
  console.log('[09a] default genIncidence result:', JSON.stringify(rA.result))
  filewrite(rA.structure, 'incidence-default-structure')

  // Sketch B: genIncidence = false
  const skB = (await api.v1.sketch.create({ id: partId })).result
  const rB = await api.v1.sketch.geometry({
    id: skB,
    lines: [
      { startPos: [0, 0, 0], endPos: [30, 0, 0] },
      { startPos: [30, 0, 0], endPos: [30, 30, 0] },
    ],
    genIncidence: false,
  })
  console.log('[09b] genIncidence=false result:', JSON.stringify(rB.result))
  filewrite(rB.structure, 'incidence-off-structure')

  return { partId }
}
