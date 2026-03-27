// 07 — Error cases for updateWorkPlane
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP_test' })).result

  // A) Missing id
  try {
    const r1 = await api.v1.part.updateWorkPlane({})
    console.log('[07] no id — result:', r1.result, 'maxLevel:', r1.maxLevel)
    if (r1.messages?.length) console.log('[07] msgs:', r1.messages[0]?.message)
  } catch (e) {
    console.log('[07] no id — error:', e.message)
  }

  // B) Invalid id (part ID instead of workplane ID)
  const r2 = await api.v1.part.updateWorkPlane({ id: partId, offset: 10 })
  console.log('[07] partId as id — result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[07] msgs:', r2.messages[0]?.message)

  // C) Update with invalid type
  const r3 = await api.v1.part.updateWorkPlane({ id: wpId, type: 'BOGUS' })
  console.log('[07] bogus type — result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[07] msgs:', r3.messages[0]?.message)

  // D) No-op update (no params besides id)
  const r4 = await api.v1.part.updateWorkPlane({ id: wpId })
  console.log('[07] no-op — result:', r4.result, 'maxLevel:', r4.maxLevel)

  return { partId, wpId }
}
