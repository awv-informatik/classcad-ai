// 01 — isClockwise ground truth on the Top plane.
// Method: arc + chord line → extrude the segment region → volume + COG.
// The segment lies on the BULGE side of the chord; volume separates minor/major.
// Cases: quarter arc (10,0)→(0,10) c=(0,0) r=10, and semicircle (−10,0)→(10,0).
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FlagTop' })).result
  const partR = await api.v1.common.recalc()
  const top = Object.values(partR.structure.tree).find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top')
  console.log('[01] part', partId, 'topPlane', top?.id)

  const R = 10,
    H = 5
  // analytic expectations
  const minorSegArea = ((R * R) / 2) * (Math.PI / 2 - 1) // 28.5398
  const majorSegArea = ((R * R) / 2) * (1.5 * Math.PI + 1) // 285.6194
  const semiArea = (Math.PI * R * R) / 2 // 157.0796
  console.log(
    '[01] expect vol: minorSeg',
    (minorSegArea * H).toFixed(2),
    'majorSeg',
    (majorSegArea * H).toFixed(2),
    'semi',
    (semiArea * H).toFixed(2),
  )

  const cases = [
    // quarter arcs: chord from (10,0) to (0,10); minor bulge side = +x+y (COG x,y > chord), major = −x−y
    { label: 'quarter cw=true', start: [10, 0, 0], end: [0, 10, 0], cw: true },
    { label: 'quarter cw=false', start: [10, 0, 0], end: [0, 10, 0], cw: false },
    // semicircles: chord on the x-axis; bulge side = +y or −y. Volume IDENTICAL both ways — only COG discriminates.
    { label: 'semi cw=true', start: [-10, 0, 0], end: [10, 0, 0], cw: true },
    { label: 'semi cw=false', start: [-10, 0, 0], end: [10, 0, 0], cw: false },
  ]

  const out = []
  for (const c of cases) {
    // each case in its own sketch so regions don't interfere
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
    const ext = (await api.v1.part.extrusion({ id: partId, name: 'E_' + c.label, references: [arc, chord], type: 'UP', limit2: H })).result
    const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
    // isolate this solid's contribution: delete the extrusion after measuring
    out.push({ label: c.label, arc, chord, ext, volume: mp?.volume, cog: mp?.centerOfGravity })
    console.log('[01]', c.label, 'arc', arc, 'ext', ext, 'vol', mp?.volume?.toFixed(3), 'cog', JSON.stringify(mp?.centerOfGravity))
    await snapshot('01-' + c.label.replace(/[^a-z0-9]+/gi, '-'))
    if (ext) await api.v1.part.deleteFeature({ ids: [ext] })
    await api.v1.sketch.deleteObject({ ids: [arc, chord] })
  }
  filewrite(out, 'cases')
  return out
}
