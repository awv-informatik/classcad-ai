// Q: Real-world example — parametric L-bracket with master dimensions
// A simple L-bracket: base plate + vertical wall, all driven by expressions
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'LBracket' })).result

  // Master dimensions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'plateL', value: 100 },
      { name: 'plateW', value: 80 },
      { name: 'thick', value: 10 },
      { name: 'wallH', value: 'plateL * 0.6' },  // derived from plate length
    ],
  })

  // Base plate
  await api.v1.part.box({
    id: partId, name: 'BasePlate',
    length: '@expr.plateL', width: '@expr.plateW', height: '@expr.thick',
  })

  // Vertical wall — stacked on top of plate, at one edge
  const wallWcs = (await api.v1.part.workCSys({
    id: partId, name: 'WallOrigin',
    offset: '[0, 0, @expr.thick]',
  })).result

  await api.v1.part.box({
    id: partId, name: 'Wall',
    references: [wallWcs],
    length: '@expr.thick', width: '@expr.plateW', height: '@expr.wallH',
  })

  await snapshot('bracket-small')
  console.log('[10] L-bracket at plateL=100')

  // Scale up — change master → everything follows
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [
      { name: 'plateL', value: 200 },
      { name: 'plateW', value: 120 },
      { name: 'thick', value: 15 },
    ],
  })
  await api.v1.common.recalc()

  const wallH = (await api.v1.part.getExpression({ id: partId, name: 'wallH' })).result
  console.log('[10] wallH after scale:', wallH.value, '(should be 120 = 200*0.6)')

  await snapshot('bracket-large')
  console.log('[10] parametric bracket: ✓ master dims → derived → WCS + features all scaled')
  return { partId }
}
