// 03 — Name parameter: default name, duplicates, getWorkGeometry lookup
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // A) Two with default name — does it auto-increment?
  const wp1 = await api.v1.part.workPlane({ id: partId })
  const wp2 = await api.v1.part.workPlane({ id: partId })
  console.log('[03] default#1:', wp1.result, 'default#2:', wp2.result)

  // B) Custom name
  const wp3 = await api.v1.part.workPlane({ id: partId, name: 'MyPlane' })
  console.log('[03] MyPlane:', wp3.result)

  // C) Duplicate custom name
  const wp4 = await api.v1.part.workPlane({ id: partId, name: 'MyPlane' })
  console.log('[03] dup MyPlane:', wp4.result, 'maxLevel:', wp4.maxLevel)
  if (wp4.messages?.length) console.log('[03] dup messages:', JSON.stringify(wp4.messages))

  // D) Look up by name
  const g1 = await api.v1.part.getWorkGeometry({ id: partId, name: 'WorkPlane' })
  console.log('[03] lookup "WorkPlane":', g1.result)

  const g2 = await api.v1.part.getWorkGeometry({ id: partId, name: 'MyPlane' })
  console.log('[03] lookup "MyPlane":', g2.result)

  // E) Look up non-existent name
  const g3 = await api.v1.part.getWorkGeometry({ id: partId, name: 'DoesNotExist' })
  console.log('[03] lookup "DoesNotExist":', g3.result, 'maxLevel:', g3.maxLevel)

  // F) Look up built-in planes
  const gTop = await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })
  const gFront = await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })
  const gRight = await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })
  console.log('[03] builtins — Top:', gTop.result, 'Front:', gFront.result, 'Right:', gRight.result)

  return { partId }
}
