// 01 — Basic: rename a part
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OriginalName' })).result
  console.log('[01] partId:', partId)

  // Check structure before rename to see original name
  const beforeStruct = (await api.v1.part.create({ name: 'Dummy' })) // just to get structure
  // Actually let's get structure from a harmless call
  const beforeR = await api.v1.common.getAppVersion({})
  filewrite(beforeR.structure, 'structure-before')

  // Rename the part
  const r = await api.v1.common.setObjectName({ id: partId, name: 'RenamedPart' })
  console.log('[01] setObjectName result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rename-response')
  filewrite(r.structure, 'structure-after')

  return { partId }
}
