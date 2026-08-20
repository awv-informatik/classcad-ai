// 07 — when does updateGeometry honor isClockwise? 05a showed: same positions +
// cw=true → silently ignored (maxLevel 31, bulge unchanged). Matrix here:
// (a) update to NEW positions WITH cw=true — honored?
// (b) update to NEW positions WITHOUT the flag — which sweep results?
// (c) recreate-at-new-positions control with cw=true for comparison.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdFlag' })).result
  const partR = await api.v1.common.recalc()
  const top = Object.values(partR.structure.tree).find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const bulgeOf = async (arc) => {
    const rc = await api.v1.common.recalc()
    return rc.structure?.tree?.[String(arc)]?.members?.bulge?.value
  }

  // (a) minor CCW arc r=10, update to r=20 endpoints WITH cw=true
  const skA = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
  const aA = (
    await api.v1.sketch.arcByCenter({
      id: skA,
      startPos: [10, 0, 0],
      endPos: [0, 10, 0],
      centerPos: [0, 0, 0],
      isClockwise: false,
      genFixation: false,
      genIncidence: false,
    })
  ).result
  const b0 = await bulgeOf(aA)
  const rA = await api.v1.sketch.updateGeometry({
    id: skA,
    arcsByCenter: [{ id: aA, startPos: [20, 0, 0], endPos: [0, 20, 0], centerPos: [0, 0, 0], isClockwise: true }],
  })
  const bA = await bulgeOf(aA)
  const pA = (await api.v1.sketch.getPositions({ id: aA })).result
  console.log(
    '[07a] created cw=false bulge',
    b0?.toFixed(4),
    '→ update newPos + cw=true: bulge',
    bA?.toFixed(4),
    'maxLevel',
    rA.maxLevel,
    'start',
    JSON.stringify(pA?.startPos),
  )

  // (b) fresh minor CCW arc, update to r=20 WITHOUT flag
  const skB = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
  const aB = (
    await api.v1.sketch.arcByCenter({
      id: skB,
      startPos: [10, 0, 0],
      endPos: [0, 10, 0],
      centerPos: [0, 0, 0],
      isClockwise: false,
      genFixation: false,
      genIncidence: false,
    })
  ).result
  const rB = await api.v1.sketch.updateGeometry({
    id: skB,
    arcsByCenter: [{ id: aB, startPos: [20, 0, 0], endPos: [0, 20, 0], centerPos: [0, 0, 0] }],
  })
  const bB = await bulgeOf(aB)
  console.log('[07b] created cw=false, update newPos NO flag: bulge', bB?.toFixed(4), 'maxLevel', rB.maxLevel)

  // (b2) fresh MAJOR arc (cw=true), update without flag — does it keep major?
  const skB2 = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
  const aB2 = (
    await api.v1.sketch.arcByCenter({
      id: skB2,
      startPos: [10, 0, 0],
      endPos: [0, 10, 0],
      centerPos: [0, 0, 0],
      isClockwise: true,
      genFixation: false,
      genIncidence: false,
    })
  ).result
  const rB2 = await api.v1.sketch.updateGeometry({
    id: skB2,
    arcsByCenter: [{ id: aB2, startPos: [20, 0, 0], endPos: [0, 20, 0], centerPos: [0, 0, 0] }],
  })
  const bB2 = await bulgeOf(aB2)
  console.log('[07b2] created cw=true, update newPos NO flag: bulge', bB2?.toFixed(4), 'maxLevel', rB2.maxLevel)

  // (c) control: fresh creation at the new positions with cw=true
  const skC = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
  const aC = (
    await api.v1.sketch.arcByCenter({
      id: skC,
      startPos: [20, 0, 0],
      endPos: [0, 20, 0],
      centerPos: [0, 0, 0],
      isClockwise: true,
      genFixation: false,
      genIncidence: false,
    })
  ).result
  const bC = await bulgeOf(aC)
  console.log('[07c] control fresh cw=true at new pos: bulge', bC?.toFixed(4))

  const out = { createdCCW: b0, updWithFlag: bA, updNoFlagFromCCW: bB, updNoFlagFromCW: bB2, controlCW: bC }
  filewrite(out, 'updflag')
  return out
}
