// 02 — USERDEFINED type: testing normal, position, offset individually and combined
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a box as visual reference
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // A) XY plane (normal=[0,0,1]) at origin
  const wp1 = await api.v1.part.workPlane({ id: partId, name: 'WP_XY', normal: [0, 0, 1] })
  console.log('[02] WP_XY:', wp1.result, 'maxLevel:', wp1.maxLevel)

  // B) XZ plane (normal=[0,1,0]) at origin
  const wp2 = await api.v1.part.workPlane({ id: partId, name: 'WP_XZ', normal: [0, 1, 0] })
  console.log('[02] WP_XZ:', wp2.result, 'maxLevel:', wp2.maxLevel)

  // C) Custom position — plane at center of box
  const wp3 = await api.v1.part.workPlane({ id: partId, name: 'WP_center', normal: [0, 0, 1], position: [40, 30, 20] })
  console.log('[02] WP_center:', wp3.result, 'maxLevel:', wp3.maxLevel)

  // D) Offset only (default normal [1,0,0] + offset=50)
  const wp4 = await api.v1.part.workPlane({ id: partId, name: 'WP_offset50', offset: 50 })
  console.log('[02] WP_offset50:', wp4.result, 'maxLevel:', wp4.maxLevel)

  // E) Combo: custom normal + position + offset
  const wp5 = await api.v1.part.workPlane({ id: partId, name: 'WP_combo', normal: [0, 0, 1], position: [0, 0, 0], offset: 40 })
  console.log('[02] WP_combo:', wp5.result, 'maxLevel:', wp5.maxLevel)

  await snapshot('userdefined-params')
  return { partId }
}
