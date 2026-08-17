// open → updateWorkPlane → close pattern: move a workPlane from z=50 to z=100
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'UpdateWP' })).result

  // Create a box so we have visible geometry to compare
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[02] boxId:', boxId)

  // Create a workPlane at z=50
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'WP1',
    position: [0, 0, 50],
    normal: [0, 0, 1],
  })).result
  console.log('[02] wpId:', wpId)

  await snapshot('before-update')

  // open → update → close
  await api.v1.part.openFeature({ id: wpId })
  const updateRes = await api.v1.part.updateWorkPlane({ id: wpId, position: [0, 0, 100] })
  console.log('[02] updateWorkPlane result:', updateRes.result, 'maxLevel:', updateRes.maxLevel)
  await api.v1.part.closeFeature({ id: wpId })

  await snapshot('after-update')

  // Verify by reading back the expression
  const posExpr = await api.v1.part.getExpression({ id: wpId, name: 'position' })
  console.log('[02] position after update:', posExpr.result)

  return { partId, wpId, boxId }
}
