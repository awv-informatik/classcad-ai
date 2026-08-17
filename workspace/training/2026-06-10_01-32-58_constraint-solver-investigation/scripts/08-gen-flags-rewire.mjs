// Q7: do gen* auto-constraints WIRE a profile so dimension edits move connected geometry?
// Rect A: gen defaults ON. Rect B: all gen OFF. Same OFFSET width dim on the bottom line.
// If A stays closed and B tears apart, the "always disable gen*" advice is wrong for
// the constrained workflow.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Gen' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const build = async (name, flags) => {
    const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name })).result
    const ids = (await api.v1.sketch.line([
      { id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0], ...flags },
      { id: skId, startPos: [80, 0, 0], endPos: [80, 50, 0], ...flags },
      { id: skId, startPos: [80, 50, 0], endPos: [0, 50, 0], ...flags },
      { id: skId, startPos: [0, 50, 0], endPos: [0, 0, 0], ...flags },
    ])).result
    return { skId, ids }
  }
  const measure = async (ids) => {
    const out = []
    for (const id of ids) out.push((await api.v1.sketch.getPositions({ id })).result)
    return out
  }

  // A: defaults (gen ON)
  const A = await build('GenOn', {})
  const aFix = (await api.v1.sketch.getPoints({ id: A.ids[0] })).result
  await api.v1.sketch.constraint({ id: A.skId, type: 'FIXATION', geomIds: [aFix.startId] })
  const aDim = await api.v1.sketch.dimension({ id: A.skId, type: 'OFFSET', geomIds: [A.ids[0]], value: 100 })
  const aPos = await measure(A.ids)
  console.log('[08] A(gen ON) dim maxLevel:', aDim.maxLevel)
  console.log('[08] A bottom:', JSON.stringify(aPos[0]))
  console.log('[08] A right :', JSON.stringify(aPos[1]))
  console.log('[08] A top   :', JSON.stringify(aPos[2]))
  const aClosed = Math.hypot(aPos[0].endPos.x - aPos[1].startPos.x, aPos[0].endPos.y - aPos[1].startPos.y) < 1e-9
    && Math.hypot(aPos[1].endPos.x - aPos[2].startPos.x, aPos[1].endPos.y - aPos[2].startPos.y) < 1e-9
  console.log('[08] A profile still closed after width 80→100:', aClosed)

  // B: gen OFF
  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false }
  const B = await build('GenOff', noGen)
  const bFix = (await api.v1.sketch.getPoints({ id: B.ids[0] })).result
  await api.v1.sketch.constraint({ id: B.skId, type: 'FIXATION', geomIds: [bFix.startId] })
  const bDim = await api.v1.sketch.dimension({ id: B.skId, type: 'OFFSET', geomIds: [B.ids[0]], value: 100 })
  const bPos = await measure(B.ids)
  console.log('[08] B(gen OFF) dim maxLevel:', bDim.maxLevel)
  console.log('[08] B bottom:', JSON.stringify(bPos[0]))
  console.log('[08] B right :', JSON.stringify(bPos[1]))
  const bClosed = Math.hypot(bPos[0].endPos.x - bPos[1].startPos.x, bPos[0].endPos.y - bPos[1].startPos.y) < 1e-9
  console.log('[08] B profile still closed:', bClosed, '(expect torn: bottom stretched, right stayed)')

  // count Auto_* constraints in A
  const last = await api.v1.sketch.getGeometry({ id: A.skId })
  const autos = Object.values(last.structure?.tree ?? {}).filter(n => n?.name?.startsWith?.('Auto_'))
  console.log('[08] Auto_* constraints in sketch A:', autos.length, '— types:', [...new Set(autos.map(a => a.class))].join(','))

  filewrite({ aPos, bPos, aClosed, bClosed, autoCount: autos.length }, 'genflags')
  return { aClosed, bClosed }
}
