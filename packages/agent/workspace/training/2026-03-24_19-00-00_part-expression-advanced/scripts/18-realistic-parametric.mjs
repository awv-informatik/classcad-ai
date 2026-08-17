// Realistic parametric model: a flanged block driven by expressions
// Base block + smaller block on top, all proportional to master dims
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FlangedBlock' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'baseL', value: 120 },
      { name: 'baseW', value: 80 },
      { name: 'baseH', value: 30 },
      { name: 'towerL', value: 'baseL * 0.5' },
      { name: 'towerW', value: 'baseW * 0.5' },
      { name: 'towerH', value: 'baseL * 0.8' },
      { name: 'holeDiam', value: 'min(towerL, towerW) * 0.6' },
    ],
  })

  // Base plate
  const baseId = (await api.v1.part.box({
    id: partId,
    name: 'BasePlate',
    length: '@expr.baseL',
    width: '@expr.baseW',
    height: '@expr.baseH',
  })).result

  // Tower on top (offset via WCS)
  const wcsId = (await api.v1.part.workCSys({
    id: partId,
    name: 'TowerOrigin',
    offset: '[@expr.baseL/4, @expr.baseW/4, @expr.baseH]',
  })).result

  const towerId = (await api.v1.part.box({
    id: partId,
    name: 'Tower',
    references: [wcsId],
    length: '@expr.towerL',
    width: '@expr.towerW',
    height: '@expr.towerH',
  })).result

  // Cylinder for visual reference
  const cylId = (await api.v1.part.cylinder({
    id: partId,
    name: 'Hole',
    references: [wcsId],
    diameter: '@expr.holeDiam',
    height: '@expr.towerH',
  })).result

  await snapshot('flanged-block')

  // Now change the master dimension and recalc — everything should scale
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'baseL', value: 200 }],
  })
  await api.v1.common.recalc()

  await snapshot('flanged-block-scaled')

  // Verify derived values cascaded
  const tv = await api.v1.part.getExpression({ id: partId, name: 'towerL' })
  console.log('[18] towerL after scale:', tv.result.value, '(expect 100)')
  const hv = await api.v1.part.getExpression({ id: partId, name: 'towerH' })
  console.log('[18] towerH after scale:', hv.result.value, '(expect 160)')

  return { partId }
}
