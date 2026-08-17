/**
 * 01b (variant B) — follow-ups with actual readbacks:
 * a2) @expr in dimensions: does the radius REALLY follow? Is it LIVE
 *     (updateExpression → dim re-solves)?
 * b2) consumed-tool expression regen: what does the geometry actually look
 *     like after updateExpression (snapshot + body enumeration + double recalc)?
 */
export default async function (api, { snapshot, filewrite }) {
  const out = {}
  const vol = async (id) => (await api.v1.part.calculateMassProperties({ id })).result.volume

  // ---------- a2: expression-bound dimension with readback
  {
    const partR = await api.v1.part.create({ name: 'ExprDim' })
    const partId = partR.result
    const top = Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === 'Top').id
    await api.v1.part.expression({ id: partId, toCreate: [{ name: 'RR', value: 25 }] })
    const sk = (await api.v1.sketch.create({ id: partId, planeId: top, name: 'S' })).result
    const c = (await api.v1.sketch.circle({ id: sk, centerPos: [0, 0, 0], radius: 10 })).result

    const readR = async () => {
      const st = (await api.v1.common.batch({ jobs: [{ api: 'v1.sketch.getGeometry', param: { id: sk } }] }))
      // radius via structure tree of a cheap call
      const tree = st.structure?.tree ?? {}
      const node = tree[c]
      return node?.members?.radius?.value ?? node?.members?.radius ?? null
    }
    const r0 = await readR()
    const dim = await api.v1.sketch.dimension({ id: sk, type: 'RADIUS', geomIds: [c], value: '@expr.RR' })
    const r1 = await readR()
    // live? update the expression
    const up1 = await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'RR', value: 18 }] })
    const r2 = await readR()
    await api.v1.common.recalc({})
    const r3 = await readR()
    out.exprDim = {
      dimLevel: dim.maxLevel, dimId: dim.result,
      radiusSeed: r0, radiusAfterDim: r1, radiusAfterExprUpdate: r2, radiusAfterRecalc: r3,
      boundAtCreate: Math.abs((r1 ?? 0) - 25) < 1e-6,
      live: Math.abs((r3 ?? 0) - 18) < 1e-6,
    }
    console.log('[01b-a2] @expr dim readback:', JSON.stringify(out.exprDim))

    // formula referencing an expression inside a dim value?
    const dim2 = await api.v1.sketch.dimension({ id: sk, type: 'DIAMETER', geomIds: [c], value: 'RR*2' })
    const r4 = await readR()
    out.exprFormulaDim = { level: dim2.maxLevel, result: dim2.result, radiusAfter: r4, works: Math.abs((r4 ?? 0) - 18) < 1e-6 }
    console.log('[01b-a2] formula-with-expr dim:', JSON.stringify(out.exprFormulaDim))
  }

  await api.v1.common.clear({})

  // ---------- b2: consumed-tool expression regen, with eyes on
  {
    const partId = (await api.v1.part.create({ name: 'ExprBool2' })).result
    await api.v1.part.expression({ id: partId, toCreate: [{ name: 'D', value: 20 }] })
    const box = (await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 80, height: 10, translation: [-40, -40, 0] })).result
    const wcs = (await api.v1.part.workCSys({ id: partId, name: 'W', offset: [0, 0, -5], rotation: [0, 0, 0] })).result
    const cyl = (await api.v1.part.cylinder({ id: partId, name: 'Hole', references: [wcs], diameter: '@expr.D', height: 20 })).result
    const bool = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: box, tools: [cyl] })).result
    await api.v1.common.recalc({})
    const v1 = await vol(partId)
    await snapshot('before-expr-update')
    const up = await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'D', value: 30 }] })
    const v2 = await vol(partId)
    await api.v1.common.recalc({})
    const v3 = await vol(partId)
    await api.v1.common.recalc({})
    const v4 = await vol(partId)
    await snapshot('after-expr-update')
    out.consumedTool = {
      updateLevel: up.maxLevel, updateMsgs: up.messages,
      volInitial: v1, volAfterUpdate: v2, volAfterRecalc: v3, volAfterRecalc2: v4,
      expectedIfRegen: +(v1 - Math.PI * (15 ** 2 - 10 ** 2) * 10).toFixed(1),
    }
    console.log('[01b-b2] consumed-tool expr:', JSON.stringify(out.consumedTool))
  }

  filewrite(out, 'probe-expr-dims')
  return out
}
