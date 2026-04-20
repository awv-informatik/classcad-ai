export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result

  // Create expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'R', value: 40 },
      { name: 'factor', value: 2 },
    ],
  })

  // Sphere with @expr.R
  const r1 = await api.v1.part.sphere({ id: partId, name: 'ExprSphere', radius: '@expr.R' })
  console.log('[06] @expr.R result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Sphere with inline math
  const r2 = await api.v1.part.sphere({ id: partId, name: 'MathSphere', radius: 'sqrt(900)' })
  console.log('[06] sqrt(900) result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Sphere with combined expression
  const r3 = await api.v1.part.sphere({ id: partId, name: 'ComboSphere', radius: '@expr.R * @expr.factor' })
  console.log('[06] combo result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    exprRef: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    inlineMath: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
    combined: { result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel },
  }, 'expression-response')

  await snapshot('expressions')
  return { partId }
}
