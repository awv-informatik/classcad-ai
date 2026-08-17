export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeExpressions' })).result

  // Create named expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'BD', value: 60 },
      { name: 'TD', value: 15 },
      { name: 'H', value: 100 },
    ],
  })

  // Cone with @expr. references
  const r1 = await api.v1.part.cone({
    id: partId, name: 'ExprCone',
    bDiameter: '@expr.BD',
    tDiameter: '@expr.TD',
    height: '@expr.H',
  })
  console.log('[08] expr cone result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Cone with inline math
  const r2 = await api.v1.part.cone({
    id: partId, name: 'MathCone',
    bDiameter: '4*20',
    tDiameter: 'sqrt(100)',
    height: '50+50',
  })
  console.log('[08] math cone result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    exprCone: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    mathCone: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'expressions-response')

  await snapshot('expressions')
  return { partId, exprConeId: r1.result, mathConeId: r2.result }
}
