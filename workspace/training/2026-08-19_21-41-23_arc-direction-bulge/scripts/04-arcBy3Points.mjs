// 04 — arcBy3Points: sweep is fixed by the on-arc midPos (no flag). What bulge results?
// Two mirror cases: same start/end (chord on x-axis), midPos at (0,10) vs (0,-10).
// Plus a minor/major pair via off-apex midpoints.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Arc3P' })).result
  const partR = await api.v1.common.recalc()
  const top = Object.values(partR.structure.tree).find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const H = 5
  const s = Math.SQRT1_2 * 10
  const cases = [
    { label: 'mid +y apex', start: [-10, 0, 0], end: [10, 0, 0], mid: [0, 10, 0] },
    { label: 'mid -y apex', start: [-10, 0, 0], end: [10, 0, 0], mid: [0, -10, 0] },
    // start at 0°, end at 90°, mid at 45° (minor) vs mid at 225° (major)
    { label: 'minor via 45deg', start: [10, 0, 0], end: [0, 10, 0], mid: [s, s, 0] },
    { label: 'major via 225deg', start: [10, 0, 0], end: [0, 10, 0], mid: [-s, -s, 0] },
  ]

  const out = []
  for (const c of cases) {
    const skId = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
    const r = await api.v1.sketch.arcBy3Points({
      id: skId,
      startPos: c.start,
      endPos: c.end,
      midPos: c.mid,
      genFixation: false,
      genIncidence: false,
    })
    const arc = r.result
    if (!arc) {
      console.log('[04]', c.label, 'FAILED', r.maxLevel, JSON.stringify(r.messages)?.slice(0, 200))
      out.push({ label: c.label, error: r.messages })
      continue
    }
    const rc = await api.v1.common.recalc()
    const node = rc.structure?.tree?.[String(arc)]
    const bulge = node?.members?.bulge?.value
    const pos = (await api.v1.sketch.getPositions({ id: arc })).result
    const chord = (
      await api.v1.sketch.line({
        id: skId,
        startPos: c.start,
        endPos: c.end,
        genFixation: false,
        genIncidence: false,
        genVertAndHoriz: false,
      })
    ).result
    const ext = (await api.v1.part.extrusion({ id: partId, name: 'E', references: [arc, chord], type: 'UP', limit2: H })).result
    const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
    out.push({ label: c.label, arc, bulge, pos, volume: mp?.volume, cog: mp?.cog })
    console.log(
      '[04]',
      c.label,
      'bulge',
      bulge?.toFixed(5),
      'vol',
      mp?.volume?.toFixed(2),
      'cog',
      mp?.cog ? `${mp.cog.x.toFixed(2)},${mp.cog.y.toFixed(2)}` : null,
      'start',
      JSON.stringify(pos?.startPos),
    )
    if (ext) await api.v1.part.deleteFeature({ ids: [ext] })
    await api.v1.sketch.deleteObject({ ids: [arc, chord] })
  }
  filewrite(out, 'arc3p')
  return out
}
