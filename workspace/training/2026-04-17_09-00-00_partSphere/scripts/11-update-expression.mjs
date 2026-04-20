export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereTest' })).result

  // Reference box for scale comparison
  await api.v1.part.box({ id: partId, name: 'Ref', length: 20, width: 20, height: 20 })

  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'R', value: 30 }] })

  const sphereId = (await api.v1.part.sphere({ id: partId, name: 'S1', radius: 40 })).result
  console.log('[11] sphereId:', sphereId)

  await snapshot('before-expr-update')

  // Update radius to expression
  await api.v1.part.openFeature({ id: sphereId })
  const ur = await api.v1.part.updateSphere({ id: sphereId, radius: '@expr.R' })
  console.log('[11] update to expr result:', ur.result, 'maxLevel:', ur.maxLevel)
  await api.v1.part.closeFeature({ id: sphereId })

  filewrite({ result: ur.result, messages: ur.messages, maxLevel: ur.maxLevel }, 'expr-update-response')
  await snapshot('after-expr-update')

  // Now change the expression value and recalc
  await api.v1.part.updateExpression({ id: partId, name: 'R', value: '80' })
  await api.v1.common.recalc({})
  await snapshot('after-expr-change')

  return { partId, sphereId }
}
