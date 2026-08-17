// Investigate xAxis==normal more carefully — is it degenerate or just non-renderable?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'XAxisNormalTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: xAxis==normal=[0,0,1] — degenerate case
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Degenerate' })).result
  const r1 = await api.v1.curve.ellipse({
    id: s1, centerPos: [0, 0, 0], radius1: 25, radius2: 10,
    xAxis: [0, 0, 1], normal: [0, 0, 1]
  })
  console.log('[09] xAxis==normal: maxLevel:', r1.maxLevel)
  filewrite(r1.graphic, 'degenerate-graphic')
  filewrite(r1.structure, 'degenerate-structure')

  // Shape 2: default xAxis/normal (for comparison)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Normal' })).result
  const r2 = await api.v1.curve.ellipse({
    id: s2, centerPos: [50, 0, 0], radius1: 25, radius2: 10
  })
  console.log('[09] default: maxLevel:', r2.maxLevel)
  filewrite(r2.graphic, 'default-graphic')

  await snapshot('xaxis-eq-normal-isolated')
  return { partId }
}
