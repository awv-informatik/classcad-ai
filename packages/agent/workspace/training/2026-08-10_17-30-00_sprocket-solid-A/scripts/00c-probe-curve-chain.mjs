/** 00c — curve-API chain mechanics: cw semantics + winding order (half-discs). */
export default async function (api, { filewrite }) {
  const out = {}
  const partId = (await api.v1.part.create({ name: 'ChainProbe' })).result
  const eif = (await api.v1.part.entityInjection({ id: partId, name: 'E' })).result
  let vPrev = 0, cPrev = [0, 0, 0]
  const mp = async (label) => {
    const r = (await api.v1.part.calculateMassProperties({ id: partId })).result
    if (!r) { console.log(`[00c] ${label}: massProps NULL`); return null }
    const vi = r.volume - vPrev
    const ci = [0, 1, 2].map((k) => ([r.cog.x, r.cog.y, r.cog.z][k] * r.volume - cPrev[k] * vPrev) / vi)
    vPrev = r.volume; cPrev = [r.cog.x, r.cog.y, r.cog.z]
    console.log(`[00c] ${label}: Vi=${vi.toFixed(1)} COGi=[${ci.map((c) => c.toFixed(2)).join(',')}]`)
    return { vi, ci }
  }

  // case 1: CCW winding — line left→right along y=0, then arc back right→left, cw=true (bulge -y?)
  {
    const sh = (await api.v1.curve.shape({ id: eif, name: 'S1' })).result
    await api.v1.curve.line({ id: sh, startPos: [50, 0, 0], endPos: [70, 0, 0] })
    await api.v1.curve.arcByCenter({ id: sh, centerPos: [60, 0, 0], startPos: [70, 0, 0], endPos: [50, 0, 0], isClockwise: true })
    const e = await api.v1.solid.extrusion({ id: eif, curves: sh, direction: [0, 0, 4] })
    console.log('[00c] case1 (line→, arc cw=true):', e.result, e.maxLevel)
    out.case1 = await mp('case1')
  }
  // case 2: same points, arc cw=false
  {
    const sh = (await api.v1.curve.shape({ id: eif, name: 'S2' })).result
    await api.v1.curve.line({ id: sh, startPos: [150, 0, 0], endPos: [170, 0, 0] })
    await api.v1.curve.arcByCenter({ id: sh, centerPos: [160, 0, 0], startPos: [170, 0, 0], endPos: [150, 0, 0], isClockwise: false })
    const e = await api.v1.solid.extrusion({ id: eif, curves: sh, direction: [0, 0, 4] })
    console.log('[00c] case2 (line→, arc cw=false):', e.result, e.maxLevel)
    out.case2 = await mp('case2')
  }
  // case 3: reversed chain order (arc first), cw=true
  {
    const sh = (await api.v1.curve.shape({ id: eif, name: 'S3' })).result
    await api.v1.curve.arcByCenter({ id: sh, centerPos: [260, 0, 0], startPos: [270, 0, 0], endPos: [250, 0, 0], isClockwise: true })
    await api.v1.curve.line({ id: sh, startPos: [250, 0, 0], endPos: [270, 0, 0] })
    const e = await api.v1.solid.extrusion({ id: eif, curves: sh, direction: [0, 0, 4] })
    console.log('[00c] case3 (arc cw=true, line→):', e.result, e.maxLevel)
    out.case3 = await mp('case3')
  }
  filewrite(out, 'chain-probe')
  return out
}
