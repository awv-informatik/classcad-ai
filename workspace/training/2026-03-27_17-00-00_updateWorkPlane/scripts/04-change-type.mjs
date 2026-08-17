// 04 — Change type from USERDEFINED to referenced type and back
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Start with USERDEFINED
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP_morph', normal: [0, 0, 1] })).result
  console.log('[04] created USERDEFINED wpId:', wpId)

  await snapshot('before-userdefined')

  // A) Change to PLANE type — reference the Top built-in plane + offset
  const topWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  await api.v1.part.openFeature({ id: wpId })
  const r1 = await api.v1.part.updateWorkPlane({ id: wpId, type: 'PLANE', references: [topWp], offset: 30 })
  console.log('[04] →PLANE:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[04] msgs:', r1.messages[0]?.message)
  await api.v1.part.closeFeature({ id: wpId })

  await snapshot('after-plane-type')

  // B) Change back to USERDEFINED with new normal
  await api.v1.part.openFeature({ id: wpId })
  const r2 = await api.v1.part.updateWorkPlane({ id: wpId, type: 'USERDEFINED', normal: [1, 0, 0], position: [40, 0, 0] })
  console.log('[04] →USERDEFINED:', r2.result, 'maxLevel:', r2.maxLevel)
  await api.v1.part.closeFeature({ id: wpId })

  await snapshot('after-back-userdefined')

  // C) Change type without providing references — error?
  await api.v1.part.openFeature({ id: wpId })
  const r3 = await api.v1.part.updateWorkPlane({ id: wpId, type: 'PLANE' })
  console.log('[04] →PLANE no refs:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[04] msgs:', r3.messages[0]?.message)
  await api.v1.part.closeFeature({ id: wpId })

  return { partId, wpId }
}
