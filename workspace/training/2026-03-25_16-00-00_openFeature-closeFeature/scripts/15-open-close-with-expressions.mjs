// Open/close with expression-linked params: update works with @expr. syntax?
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'ExprUpdate' })).result

  // Create expression
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 40 }] })

  // Create box with expression-driven height
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: '@expr.H' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 10, height: 20 })).result
  console.log('[15] boxId:', boxId, 'cylId:', cylId)

  await snapshot('before')

  // open → update height to a different expression → close
  await api.v1.part.openFeature({ id: boxId })
  const r = await api.v1.part.updateBox({ id: boxId, height: '@expr.H * 3' })
  console.log('[15] updateBox with expr result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages) {
    for (const m of r.messages) console.log('[15] msg:', m.level, m.message)
  }
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('after-expr-update')

  return { partId, boxId }
}
