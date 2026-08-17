// 09 — do INDIVIDUAL creators (sketch.line/circle/arcByCenter) auto-generate constraints?
// Exactly-tangent/coincident geometry via individual calls, then sweep for Auto_* nodes.
export default async function (api, { filewrite }) {
  const partR = await api.v1.part.create({ name: 'AutoProbe' })
  const partId = partR.result
  const wp = Object.values(partR.structure.tree).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const sk = (await api.v1.sketch.create({ id: partId, planeId: wp.id })).result

  // exactly tangent circle pair, exactly coincident + tangent line chain, axis-aligned line
  await api.v1.sketch.circle({ id: sk, centerPos: [0, 0, 0], radius: 10 })
  await api.v1.sketch.circle({ id: sk, centerPos: [15, 0, 0], radius: 5 }) // external tangency d=15
  await api.v1.sketch.line({ id: sk, startPos: [0, 10, 0], endPos: [30, 10, 0] }) // tangent to c1, horizontal
  const r = await api.v1.sketch.line({ id: sk, startPos: [30, 10, 0], endPos: [30, -10, 0] }) // coincident + vertical

  const tree = r.structure?.tree ?? {}
  const autos = Object.values(tree).filter(n => typeof n.name === 'string' && n.name.startsWith('Auto_'))
    .map(n => ({ name: n.name, class: n.class }))
  filewrite(autos, 'autos')
  console.log('[09] Auto_* after 4 individual creators:', autos.length, JSON.stringify(autos))
  return { partId, autoCount: autos.length }
}
