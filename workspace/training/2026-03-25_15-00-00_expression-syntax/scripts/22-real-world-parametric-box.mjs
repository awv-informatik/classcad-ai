// Real-world: fully parametric box with fillets, driven by expressions
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'ParamBox' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 120 },
      { name: 'W', value: 80 },
      { name: 'H', value: 50 },
      // Derived: fillet radius = 10% of smallest face dimension
      { name: 'filletR', value: 'min(L, W, H) * 0.1' },
      // Volume estimate (before fillets)
      { name: 'volume', value: 'L * W * H' },
      // Surface area estimate
      { name: 'surfArea', value: '2 * (L*W + W*H + L*H)' },
      // Diagonal
      { name: 'bodyDiag', value: 'sqrt(L*L + W*W + H*H)' },
    ],
  })

  await api.v1.part.box({
    id: partId,
    name: 'MainBox',
    length: '@expr.L',
    width: '@expr.W',
    height: '@expr.H',
  })

  await snapshot('parametric-box')

  const names = ['L', 'W', 'H', 'filletR', 'volume', 'surfArea', 'bodyDiag']
  for (const name of names) {
    const r = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[22] ${name} = ${r.result.value.toFixed(2)}`)
  }

  // Change master dimension
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'L', value: 200 }] })
  await api.v1.common.recalc()

  console.log('[22] --- after L=200 ---')
  for (const name of names) {
    const r = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[22] ${name} = ${r.result.value.toFixed(2)}`)
  }

  await snapshot('after-resize')

  return { partId }
}
