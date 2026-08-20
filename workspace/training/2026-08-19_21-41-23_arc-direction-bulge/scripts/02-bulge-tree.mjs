// 02 — bulge in the CC_CircularArc tree node + COG side-check (correct key: result.cog).
// Same four cases as 01 + a vertical-chord pair; per case read members.bulge.value,
// getObjectInfo, and segment-extrusion COG. Correlate: bulge sign ↔ flag ↔ COG side.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BulgeTree' })).result
  const partR = await api.v1.common.recalc()
  const top = Object.values(partR.structure.tree).find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const H = 5
  const cases = [
    { label: 'quarter cw=true', start: [10, 0, 0], end: [0, 10, 0], cw: true },
    { label: 'quarter cw=false', start: [10, 0, 0], end: [0, 10, 0], cw: false },
    { label: 'semi cw=true', start: [-10, 0, 0], end: [10, 0, 0], cw: true },
    { label: 'semi cw=false', start: [-10, 0, 0], end: [10, 0, 0], cw: false },
    // vertical chord for sign robustness: (0,-10)→(0,10), bulge side ±x
    { label: 'semiV cw=true', start: [0, -10, 0], end: [0, 10, 0], cw: true },
    { label: 'semiV cw=false', start: [0, -10, 0], end: [0, 10, 0], cw: false },
  ]

  const out = []
  for (const c of cases) {
    const skId = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
    const arc = (
      await api.v1.sketch.arcByCenter({
        id: skId,
        startPos: c.start,
        endPos: c.end,
        centerPos: [0, 0, 0],
        isClockwise: c.cw,
        genFixation: false,
        genIncidence: false,
      })
    ).result
    // tree node: refresh structure and pull members
    const rc = await api.v1.common.recalc()
    const node = rc.structure?.tree?.[String(arc)]
    const bulge = node?.members?.bulge?.value
    const info = (await api.v1.sketch.getObjectInfo({ id: arc })).result
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
    out.push({
      label: c.label,
      arc,
      bulge,
      cls: node?.class,
      infoKeys: info ? Object.keys(info) : null,
      info,
      posStart: pos?.startPos,
      posEnd: pos?.endPos,
      volume: mp?.volume,
      cog: mp?.cog,
    })
    console.log(
      '[02]',
      c.label,
      'bulge',
      bulge,
      'vol',
      mp?.volume?.toFixed(2),
      'cog',
      mp?.cog ? `${mp.cog.x.toFixed(2)},${mp.cog.y.toFixed(2)},${mp.cog.z.toFixed(2)}` : null,
    )
    if (ext) await api.v1.part.deleteFeature({ ids: [ext] })
    await api.v1.sketch.deleteObject({ ids: [arc, chord] })
  }
  filewrite(out, 'bulges')
  return out.map(({ label, bulge, volume, cog }) => ({ label, bulge, volume, cog }))
}
