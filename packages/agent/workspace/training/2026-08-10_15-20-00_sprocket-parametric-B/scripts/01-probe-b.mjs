/**
 * 01 (variant B) — feasibility gates for a TRUE parametric model:
 * a) @expr in sketch dimension value — re-verify the documented failure mode
 * b) updateExpression on a boolean-CONSUMED tool (cylinder d='@expr.D') —
 *    does the subtraction result regenerate? (gate for the parametric bore)
 * c) updateDimension on a sketch consumed by extrusion→boolean —
 *    does the chain regenerate? (gate for the parametric tooth form)
 * d) chamfer on the boolean result — does it survive a bore-diameter change?
 */
export default async function (api, { filewrite }) {
  const out = {}
  const vol = async (id) => (await api.v1.part.calculateMassProperties({ id })).result.volume

  // ---------- case a+b+d: expression-driven consumed tool + chamfer
  {
    const partId = (await api.v1.part.create({ name: 'ExprBool' })).result
    await api.v1.part.expression({ id: partId, toCreate: [{ name: 'D', value: 20 }] })
    const box = (await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 80, height: 10, translation: [-40, -40, 0] })).result
    const wcs = (await api.v1.part.workCSys({ id: partId, name: 'W', offset: [0, 0, -5], rotation: [0, 0, 0] })).result
    const cyl = (await api.v1.part.cylinder({ id: partId, name: 'Hole', references: [wcs], diameter: '@expr.D', height: 20 })).result
    const bool = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: box, tools: [cyl] })).result
    await api.v1.common.recalc({})
    const v1 = await vol(partId) // 64000 - pi*100*10 = 60858.4

    // (d) chamfer the hole rim
    const rim = (await api.v1.part.getGeometryIds({ id: partId, arcs: [{ pos: [10, 0, 10] }], circles: [{ pos: [10, 0, 10] }] })).result
    const rimIds = [...(rim?.arcs ?? []), ...(rim?.circles ?? [])].flat().filter((x) => typeof x === 'number')
    let chamferOk = false
    if (rimIds.length) {
      const ch = await api.v1.part.chamfer({ id: partId, name: 'Ch', references: rimIds, type: 'EQUAL_DISTANCE', distance1: 1 })
      chamferOk = ch.maxLevel <= 31
    }
    await api.v1.common.recalc({})
    const v2 = await vol(partId)

    // (b) update the expression driving the CONSUMED cylinder
    const up = await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'D', value: 30 }] })
    await api.v1.common.recalc({})
    const v3 = await vol(partId)
    const expectedHole = (Math.PI * (15 ** 2 - 10 ** 2)) * 10 // extra removed material ≈ 3927
    out.exprConsumedTool = {
      updateLevel: up.maxLevel,
      volBefore: v2, volAfter: v3,
      deltaObserved: +(v2 - v3).toFixed(1),
      deltaExpectedIfRegen: +expectedHole.toFixed(1),
      regenerates: Math.abs((v2 - v3) - expectedHole) < 300,
      chamferCreated: chamferOk,
    }
    console.log('[01b] expr on consumed tool:', JSON.stringify(out.exprConsumedTool))

    // (a) @expr in a dimension — on a quick side sketch
    const partR2 = (await api.v1.common.batch({ jobs: [{ api: 'v1.part.getWorkGeometry', param: { id: partId, name: 'Top' } }] })).result
    const topId = partR2?.[0]?.result ?? null
    const sk = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'dimExpr' })).result
    const c = (await api.v1.sketch.circle({ id: sk, centerPos: [100, 100, 0], radius: 10 })).result
    const dim = await api.v1.sketch.dimension({ id: sk, type: 'RADIUS', geomIds: [c], value: '@expr.D' })
    const dimNum = (await api.v1.sketch.dimension({ id: sk, type: 'RADIUS', geomIds: [c], value: 12 })).result
    const updExpr = await api.v1.sketch.updateDimension({ id: dimNum, value: '@expr.D' })
    out.exprInDim = { createLevel: dim.maxLevel, createResult: dim.result, updateResult: updExpr.result, updateLevel: updExpr.maxLevel }
    console.log('[01a] @expr in dimension:', JSON.stringify(out.exprInDim))
  }

  await api.v1.common.clear({})

  // ---------- case c: sketch-dim update through extrusion→boolean
  {
    const partR = await api.v1.part.create({ name: 'DimChain' })
    const partId = partR.result
    const top = Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === 'Top').id
    const box = (await api.v1.part.box({ id: partId, name: 'Box', length: 100, width: 100, height: 10 })).result
    const sk = (await api.v1.sketch.create({ id: partId, planeId: top, name: 'CutSketch' })).result
    const rect = (await api.v1.sketch.rectangle({ id: sk, startPos: [20, 20, 0], endPos: [40, 40, 0] })).result
    const pts = (await api.v1.sketch.getPoints({ id: rect[0] })).result
    await api.v1.sketch.constraint({ id: sk, type: 'FIXATION', geomIds: [pts.startId] })
    const dims = (await api.v1.sketch.dimension([
      { id: sk, name: 'cutW', type: 'OFFSET', geomIds: [rect[0]], value: 20 },
      { id: sk, name: 'cutH', type: 'OFFSET', geomIds: [rect[1]], value: 20 },
    ])).result
    const tool = (await api.v1.part.extrusion({ id: partId, name: 'CutTool', references: rect, type: 'SYMMETRIC', limit2: 40 })).result
    const bool = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: box, tools: [tool] })).result
    await api.v1.common.recalc({})
    const v1 = await vol(partId) // 100000 - 20*20*10 = 96000
    const upd = await api.v1.sketch.updateDimension({ id: dims[0], value: 40 }) // cut 40x20
    await api.v1.common.recalc({})
    const v2 = await vol(partId)
    out.dimThroughChain = {
      updResult: upd.result,
      volBefore: v1, volAfter: v2,
      deltaObserved: +(v1 - v2).toFixed(1),
      deltaExpectedIfRegen: 20 * 20 * 10,
      regenerates: Math.abs((v1 - v2) - 4000) < 50,
    }
    console.log('[01c] sketch dim through extrusion→boolean:', JSON.stringify(out.dimThroughChain))
  }

  filewrite(out, 'probe-b')
  return out
}
