// Test sketch.geometry — genVertAndHoriz flag comparison
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result

  // Sketch A: default (TRUE) — h/v lines should get HORIZONTAL/VERTICAL constraints
  const skA = (await api.v1.sketch.create({ id: partId })).result
  const rA = await api.v1.sketch.geometry({
    id: skA,
    lines: [
      { startPos: [0, 0, 0], endPos: [50, 0, 0] },   // horizontal
      { startPos: [0, 0, 0], endPos: [0, 50, 0] },   // vertical
    ],
  })
  console.log('[10a] default genVertAndHoriz result:', JSON.stringify(rA.result))
  filewrite(rA.structure, 'verthoriz-default-structure')

  // Sketch B: genVertAndHoriz = false
  const skB = (await api.v1.sketch.create({ id: partId })).result
  const rB = await api.v1.sketch.geometry({
    id: skB,
    lines: [
      { startPos: [0, 0, 0], endPos: [50, 0, 0] },
      { startPos: [0, 0, 0], endPos: [0, 50, 0] },
    ],
    genVertAndHoriz: false,
  })
  console.log('[10b] genVertAndHoriz=false result:', JSON.stringify(rB.result))
  filewrite(rB.structure, 'verthoriz-off-structure')

  return { partId }
}
