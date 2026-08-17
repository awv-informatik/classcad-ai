// 03 — Rename work geometry and test if getWorkGeometry finds it by new name
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WGTest' })).result
  const wpId = (await api.v1.part.workPlane({
    id: partId, name: 'MyPlane', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0]
  })).result
  console.log('[03] partId:', partId, 'wpId:', wpId)

  // Lookup by original name
  const lookup1 = await api.v1.part.getWorkGeometry({ id: partId, name: 'MyPlane' })
  console.log('[03] lookup by "MyPlane":', lookup1.result, 'maxLevel:', lookup1.maxLevel)

  // Rename
  const r = await api.v1.common.setObjectName({ id: wpId, name: 'RenamedPlane' })
  console.log('[03] rename result:', r.result, 'maxLevel:', r.maxLevel)

  // Lookup by OLD name (should fail or return null)
  const lookup2 = await api.v1.part.getWorkGeometry({ id: partId, name: 'MyPlane' })
  console.log('[03] lookup by OLD name "MyPlane":', lookup2.result, 'maxLevel:', lookup2.maxLevel)
  if (lookup2.messages?.length) console.log('[03] old name messages:', JSON.stringify(lookup2.messages))

  // Lookup by NEW name (should succeed)
  const lookup3 = await api.v1.part.getWorkGeometry({ id: partId, name: 'RenamedPlane' })
  console.log('[03] lookup by NEW name "RenamedPlane":', lookup3.result, 'maxLevel:', lookup3.maxLevel)

  filewrite({
    lookupOldName: { result: lookup2.result, maxLevel: lookup2.maxLevel, messages: lookup2.messages },
    lookupNewName: { result: lookup3.result, maxLevel: lookup3.maxLevel, messages: lookup3.messages }
  }, 'lookup-results')

  return { partId, wpId }
}
