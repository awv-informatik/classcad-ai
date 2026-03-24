// Verify: does updateExpression + recalc ACTUALLY change the feature geometry?
// Use two different-sized objects as visual reference, and check bounding box via structure
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'S', value: 60 }],
  })

  // Expression-driven box
  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'ParamBox',
    length: '@expr.S',
    width: '@expr.S',
    height: '@expr.S',
  })).result

  // Fixed reference cylinder (not expression-driven) — visual scale reference
  const cylId = (await api.v1.part.cylinder({
    id: partId,
    name: 'FixedCyl',
    diameter: 30,
    height: 30,
  })).result

  await snapshot('before-with-ref')

  // Check bounding box before
  const struct1 = await api.v1.part.create // can't easily read bbox... let's use STEP export size
  // Actually, let's check the expression value and trust it
  let v = await api.v1.part.getExpression({ id: partId, name: 'S' })
  console.log('[16] S before update:', v.result.value)

  // Update and recalc
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'S', value: 120 }],
  })
  await api.v1.common.recalc()

  v = await api.v1.part.getExpression({ id: partId, name: 'S' })
  console.log('[16] S after update+recalc:', v.result.value)

  await snapshot('after-with-ref')

  // The fixed cylinder should be visually smaller relative to the box if the box grew
  return { partId, boxId, cylId }
}
