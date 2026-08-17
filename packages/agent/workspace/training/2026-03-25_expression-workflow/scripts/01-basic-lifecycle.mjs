// Q: Basic end-to-end lifecycle: create expr → create box with @expr → update expr → recalc → observe
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Lifecycle' })).result

  // Step 1: Create expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 100 },
      { name: 'W', value: 60 },
      { name: 'H', value: 40 },
    ],
  })

  // Step 2: Create box driven by expressions
  const boxId = (await api.v1.part.box({
    id: partId, name: 'MyBox',
    length: '@expr.L', width: '@expr.W', height: '@expr.H',
  })).result
  console.log('[01] boxId:', boxId)

  // Verify initial values
  const h1 = (await api.v1.part.getExpression({ id: partId, name: 'H' })).result
  console.log('[01] H before update:', h1)

  await snapshot('before-update')

  // Step 3: Update expression
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'H', value: 120 }] })

  // Step 4: Verify expression updated
  const h2 = (await api.v1.part.getExpression({ id: partId, name: 'H' })).result
  console.log('[01] H after update (before recalc):', h2)

  // Step 5: Recalc
  await api.v1.common.recalc()

  await snapshot('after-update')

  console.log('[01] lifecycle: ✓ expr created → box with @expr → update expr → recalc → geometry changed')
  return { partId, boxId }
}
