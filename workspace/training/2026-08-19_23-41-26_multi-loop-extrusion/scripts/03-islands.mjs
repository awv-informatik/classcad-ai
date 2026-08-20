// 03 — (a) island inside a hole; (b) hole straddling the outline (fresh feature);
// (c) region ID as extrusion reference. Signatures (h=10): annulus40/20+island8 =
// 37699.11+2010.62=39709.73 (2 bodies); island ignored → 37699.11 (1 body).
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Islands' })).result
  const rc0 = await api.v1.common.recalc()
  const top = Object.values(rc0.structure.tree).find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const bodies = async () => {
    const g = await api.graphic()
    return Object.values(g.containers || g).filter((c) => (c.meshes || c.faces || []).length > 0).length
  }

  // (a) island: three concentric circles in one sketch
  const sk1 = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
  const cO = (await api.v1.sketch.circle({ id: sk1, centerPos: [0, 0, 0], radius: 40, genFixation: false })).result
  const cH = (await api.v1.sketch.circle({ id: sk1, centerPos: [0, 0, 0], radius: 20, genFixation: false })).result
  const cI = (await api.v1.sketch.circle({ id: sk1, centerPos: [0, 0, 0], radius: 8, genFixation: false })).result
  const rA = await api.v1.part.extrusion({ id: partId, name: 'Island', references: [cO, cH, cI], type: 'UP', limit2: 10 })
  const mpA = (await api.v1.part.calculateMassProperties({ id: partId })).result
  console.log(
    '[03a] island: ext',
    rA.result,
    'maxLevel',
    rA.maxLevel,
    'vol',
    mpA?.volume?.toFixed(2),
    '(39709.73 = annulus+island, 37699.11 = island ignored) bodies',
    await bodies(),
  )
  await snapshot('03a-island')
  if (rA.result) await api.v1.part.deleteFeature({ ids: [rA.result] })
  await api.v1.common.recalc()

  // (b) straddling hole, fresh: rect 100×60 + circle r=8 centered ON the outline
  const sk2 = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
  const rect = (await api.v1.sketch.rectangle({ id: sk2, startPos: [-50, -30, 0], endPos: [50, 30, 0] })).result
  const cS = (await api.v1.sketch.circle({ id: sk2, centerPos: [50, 0, 0], radius: 8, genFixation: false })).result
  const rB = await api.v1.part.extrusion({ id: partId, name: 'Straddle', references: [...rect, cS], type: 'UP', limit2: 10 })
  let volB = null
  if (rB.result) volB = (await api.v1.part.calculateMassProperties({ id: partId })).result?.volume
  console.log(
    '[03b] straddling: ext',
    rB.result,
    'maxLevel',
    rB.maxLevel,
    'vol',
    volB?.toFixed(2),
    rB.messages ? JSON.stringify(rB.messages).slice(0, 200) : '',
    'bodies',
    rB.result ? await bodies() : '-',
  )
  await snapshot('03b-straddle')
  if (rB.result) await api.v1.part.deleteFeature({ ids: [rB.result] })
  await api.v1.common.recalc()

  // (c) region id as reference: build plate-with-hole, find its CC_SketchRegion,
  // then extrude the REGION id in a second feature
  const sk3 = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result
  const rect3 = (await api.v1.sketch.rectangle({ id: sk3, startPos: [-30, -20, 0], endPos: [30, 20, 0] })).result
  const c3 = (await api.v1.sketch.circle({ id: sk3, centerPos: [0, 0, 0], radius: 10, genFixation: false })).result
  const rC1 = await api.v1.part.extrusion({ id: partId, name: 'Base', references: [...rect3, c3], type: 'UP', limit2: 5 })
  const rc = await api.v1.common.recalc()
  const regions = Object.values(rc.structure.tree).filter((n) => n.class === 'CC_SketchRegion')
  console.log('[03c] regions:', JSON.stringify(regions.map((n) => ({ id: n.id, name: n.name, parent: n.parent }))))
  const volBase = (await api.v1.part.calculateMassProperties({ id: partId })).result?.volume
  const reg = regions.find((n) => n.parent === sk3) || regions[0]
  const rC2 = reg ? await api.v1.part.extrusion({ id: partId, name: 'FromRegion', references: [reg.id], type: 'DOWN', limit2: 5 }) : null
  const volBoth = rC2?.result ? (await api.v1.part.calculateMassProperties({ id: partId })).result?.volume : null
  console.log(
    '[03c] base vol',
    volBase?.toFixed(2),
    '(expect 10429.2) → +region-extrude:',
    rC2?.result,
    'maxLevel',
    rC2?.maxLevel,
    'vol',
    volBoth?.toFixed(2),
    '(expect 20858.4 if region reused)',
    rC2?.messages ? JSON.stringify(rC2.messages).slice(0, 150) : '',
  )
  filewrite(
    {
      island: { ext: rA.result, vol: mpA?.volume },
      straddle: { ext: rB.result, maxLevel: rB.maxLevel, vol: volB },
      regionReuse: { regions: regions.length, ext: rC2?.result, volBase, volBoth },
    },
    'results',
  )
  return { islandVol: mpA?.volume, straddleExt: rB.result, regionExt: rC2?.result }
}
