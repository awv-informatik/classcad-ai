// 02 — plate 100×60 with two Ø16 holes (h=10): curves path; region-node scan after
// extrusion; getSketchRegion attempts; edge case: hole straddling the outline.
// Signatures: solid 60000, plate−2holes 55978.76, plate−1hole 57989.38.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PlateHoles' })).result
  const rc0 = await api.v1.common.recalc()
  const top = Object.values(rc0.structure.tree).find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result

  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [-50, -30, 0], endPos: [50, 30, 0] })).result
  const h1 = (await api.v1.sketch.circle({ id: skId, centerPos: [-25, 0, 0], radius: 8, genFixation: false })).result
  const h2 = (await api.v1.sketch.circle({ id: skId, centerPos: [25, 0, 0], radius: 8, genFixation: false })).result
  console.log('[02] rect lines:', JSON.stringify(rect), 'holes:', h1, h2)

  const refs = [...(Array.isArray(rect) ? rect : [rect]), h1, h2]
  const r = await api.v1.part.extrusion({ id: partId, name: 'Plate', references: refs, type: 'UP', limit2: 10 })
  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  const g = await api.graphic()
  const nb = Object.values(g.containers || g).filter((c) => (c.meshes || c.faces || []).length > 0).length
  console.log('[02] all-curves: ext', r.result, 'vol', mp?.volume?.toFixed(2), '(expect 55978.76) bodies', nb)

  // regions in tree AFTER extrusion?
  const rc = await api.v1.common.recalc()
  const regionNodes = Object.values(rc.structure.tree).filter((n) => /region/i.test(n.class) || /region/i.test(n.name || ''))
  console.log(
    '[02] region nodes post-extrude:',
    JSON.stringify(regionNodes.map((n) => ({ id: n.id, class: n.class, name: n.name, parent: n.parent }))).slice(0, 400),
  )

  // getSketchRegion probing: by discovered names, and by guessed names
  const tryNames = [...new Set([...regionNodes.map((n) => n.name).filter(Boolean), 'Region', 'Region1', 'SketchRegion1'])]
  for (const name of tryNames) {
    const gr = await api.v1.part.getSketchRegion({ id: partId, name })
    console.log('[02] getSketchRegion("' + name + '"):', gr.result, 'maxLevel', gr.maxLevel)
  }

  await snapshot('02-plate')

  // edge case: third hole straddling the outline (center on the edge)
  const h3 = (await api.v1.sketch.circle({ id: skId, centerPos: [50, 0, 0], radius: 8, genFixation: false })).result
  const r2 = await api.v1.part.updateExtrusion({ id: r.result, references: [...refs, h3], type: 'UP', limit2: 10 })
  const mp2 = (await api.v1.part.calculateMassProperties({ id: partId })).result
  console.log(
    '[02] +straddling hole: update maxLevel',
    r2.maxLevel,
    'vol',
    mp2?.volume?.toFixed(2),
    r2.messages ? JSON.stringify(r2.messages).slice(0, 200) : '',
  )
  await snapshot('02-straddle')

  filewrite({ ext: r.result, vol: mp?.volume, bodies: nb, regionNodes, straddleVol: mp2?.volume, straddleLevel: r2.maxLevel }, 'results')
  return { vol: mp?.volume, straddleVol: mp2?.volume }
}
