// 02 — Update normal and position on USERDEFINED plane
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Start with XY plane at origin
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP_test', normal: [0, 0, 1] })).result

  await snapshot('before-xy')

  // A) Change normal to [0,1,0] (XZ plane)
  await api.v1.part.openFeature({ id: wpId })
  const r1 = await api.v1.part.updateWorkPlane({ id: wpId, normal: [0, 1, 0] })
  console.log('[02] normal→[0,1,0]:', r1.result, 'maxLevel:', r1.maxLevel)
  await api.v1.part.closeFeature({ id: wpId })

  await snapshot('after-normal-xz')

  // B) Change position to center of box
  await api.v1.part.openFeature({ id: wpId })
  const r2 = await api.v1.part.updateWorkPlane({ id: wpId, position: [40, 30, 20] })
  console.log('[02] position→center:', r2.result, 'maxLevel:', r2.maxLevel)
  await api.v1.part.closeFeature({ id: wpId })

  await snapshot('after-position')

  // C) Change both normal and position at once
  await api.v1.part.openFeature({ id: wpId })
  const r3 = await api.v1.part.updateWorkPlane({ id: wpId, normal: [1, 1, 0], position: [0, 0, 0] })
  console.log('[02] combo:', r3.result, 'maxLevel:', r3.maxLevel)
  await api.v1.part.closeFeature({ id: wpId })

  await snapshot('after-combo')
  return { partId, wpId }
}
