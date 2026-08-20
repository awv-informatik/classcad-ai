// 05 — updateGeometry: (a) flip isClockwise in place; (b) swap start/end keeping the
// flag (expect the COMPLEMENTARY arc); (c) mirrored profile traversed in reverse with
// the SAME flag (expect the mirrored arc — the constrained-sketching claim).
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateFlip' })).result
  const partR = await api.v1.common.recalc()
  const top = Object.values(partR.structure.tree).find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const H = 5
  const measure = async (skId, arc, s, e) => {
    const chord = (
      await api.v1.sketch.line({ id: skId, startPos: s, endPos: e, genFixation: false, genIncidence: false, genVertAndHoriz: false })
    ).result
    const ext = (await api.v1.part.extrusion({ id: partId, name: 'E', references: [arc, chord], type: 'UP', limit2: H })).result
    const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
    if (ext) await api.v1.part.deleteFeature({ ids: [ext] })
    await api.v1.sketch.deleteObject({ ids: [chord] })
    return { volume: mp?.volume, cog: mp?.cog }
  }
  const bulgeOf = async (arc) => {
    const rc = await api.v1.common.recalc()
    return rc.structure?.tree?.[String(arc)]?.members?.bulge?.value
  }

  // (a) flip in place
  const sk1 = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
  const a1 = (
    await api.v1.sketch.arcByCenter({
      id: sk1,
      startPos: [10, 0, 0],
      endPos: [0, 10, 0],
      centerPos: [0, 0, 0],
      isClockwise: false,
      genFixation: false,
      genIncidence: false,
    })
  ).result
  const before = { bulge: await bulgeOf(a1), ...(await measure(sk1, a1, [10, 0, 0], [0, 10, 0])) }
  const ur = await api.v1.sketch.updateGeometry({
    id: sk1,
    arcsByCenter: [{ id: a1, startPos: [10, 0, 0], endPos: [0, 10, 0], centerPos: [0, 0, 0], isClockwise: true }],
  })
  const after = { bulge: await bulgeOf(a1), ...(await measure(sk1, a1, [10, 0, 0], [0, 10, 0])) }
  console.log(
    '[05a] flip: before bulge',
    before.bulge?.toFixed(4),
    'vol',
    before.volume?.toFixed(1),
    '→ after bulge',
    after.bulge?.toFixed(4),
    'vol',
    after.volume?.toFixed(1),
    'updateMaxLevel',
    ur.maxLevel,
  )

  // (b) swapped endpoints, same flag (fresh arc)
  const sk2 = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
  const a2 = (
    await api.v1.sketch.arcByCenter({
      id: sk2,
      startPos: [0, 10, 0],
      endPos: [10, 0, 0],
      centerPos: [0, 0, 0],
      isClockwise: false,
      genFixation: false,
      genIncidence: false,
    })
  ).result
  const swap = { bulge: await bulgeOf(a2), ...(await measure(sk2, a2, [0, 10, 0], [10, 0, 0])) }
  console.log(
    '[05b] swapped, cw=false: bulge',
    swap.bulge?.toFixed(4),
    'vol',
    swap.volume?.toFixed(1),
    'cog',
    swap.cog ? `${swap.cog.x.toFixed(2)},${swap.cog.y.toFixed(2)}` : null,
  )

  // (c) mirrored (x→−x) profile, traversed in reverse, SAME flag cw=false
  // original minor arc A: (10,0)→(0,10) cw=false bulges +x+y. Mirror: bulge side −x+y.
  // reversed traversal: start (0,10) → end (−10,0), cw=false.
  const sk3 = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
  const a3 = (
    await api.v1.sketch.arcByCenter({
      id: sk3,
      startPos: [0, 10, 0],
      endPos: [-10, 0, 0],
      centerPos: [0, 0, 0],
      isClockwise: false,
      genFixation: false,
      genIncidence: false,
    })
  ).result
  const mir = { bulge: await bulgeOf(a3), ...(await measure(sk3, a3, [0, 10, 0], [-10, 0, 0])) }
  console.log(
    '[05c] mirrored+reversed, cw=false: bulge',
    mir.bulge?.toFixed(4),
    'vol',
    mir.volume?.toFixed(1),
    'cog',
    mir.cog ? `${mir.cog.x.toFixed(2)},${mir.cog.y.toFixed(2)}` : null,
    '(expect minor, cog −5.84,+5.84)',
  )

  const out = { flip: { before, after, updateMaxLevel: ur.maxLevel }, swap, mirrorReversed: mir }
  filewrite(out, 'update')
  return out
}
