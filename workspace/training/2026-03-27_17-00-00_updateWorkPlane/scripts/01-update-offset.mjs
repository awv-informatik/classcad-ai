// 01 — Update offset on a USERDEFINED work plane (with openFeature/closeFeature)
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Create USERDEFINED XY plane at z=0
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP_test', normal: [0, 0, 1] })).result
  console.log('[01] created wpId:', wpId)

  await snapshot('before')

  // Open → update offset → close
  await api.v1.part.openFeature({ id: wpId })
  const r1 = await api.v1.part.updateWorkPlane({ id: wpId, offset: 40 })
  console.log('[01] update offset=40:', r1.result, 'maxLevel:', r1.maxLevel)
  await api.v1.part.closeFeature({ id: wpId })

  await snapshot('after-offset40')

  // Update again to 80
  await api.v1.part.openFeature({ id: wpId })
  const r2 = await api.v1.part.updateWorkPlane({ id: wpId, offset: 80 })
  console.log('[01] update offset=80:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[01] returned id === input id?', r2.result === wpId)
  await api.v1.part.closeFeature({ id: wpId })

  await snapshot('after-offset80')
  return { partId, wpId }
}
