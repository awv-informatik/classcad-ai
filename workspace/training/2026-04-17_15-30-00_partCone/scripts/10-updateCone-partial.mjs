export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConePartialUpd' })).result

  const coneId = (await api.v1.part.cone({
    id: partId, name: 'PartialCone', bDiameter: 60, tDiameter: 10, height: 80,
  })).result

  // Verify initial values via getExpression
  const bD1 = (await api.v1.part.getExpression({ id: coneId, name: 'bDiameter' })).result
  const tD1 = (await api.v1.part.getExpression({ id: coneId, name: 'tDiameter' })).result
  const h1 = (await api.v1.part.getExpression({ id: coneId, name: 'height' })).result
  console.log('[10] initial bD:', bD1, 'tD:', tD1, 'h:', h1)

  // Update only height — bDiameter and tDiameter should keep existing values
  await api.v1.part.openFeature({ id: coneId })
  const r = await api.v1.part.updateCone({ id: coneId, height: 200 })
  await api.v1.part.closeFeature({ id: coneId })

  const bD2 = (await api.v1.part.getExpression({ id: coneId, name: 'bDiameter' })).result
  const tD2 = (await api.v1.part.getExpression({ id: coneId, name: 'tDiameter' })).result
  const h2 = (await api.v1.part.getExpression({ id: coneId, name: 'height' })).result
  console.log('[10] after partial update bD:', bD2, 'tD:', tD2, 'h:', h2)

  filewrite({
    before: { bDiameter: bD1, tDiameter: tD1, height: h1 },
    after: { bDiameter: bD2, tDiameter: tD2, height: h2 },
    updateResult: { result: r.result, maxLevel: r.maxLevel },
  }, 'partial-update-response')

  return { partId, coneId }
}
