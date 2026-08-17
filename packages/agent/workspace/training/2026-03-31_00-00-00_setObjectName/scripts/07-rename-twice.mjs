// 07 — Rename the same object twice (overwrite)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'First' })).result
  console.log('[07] partId:', partId)

  const r1 = await api.v1.common.setObjectName({ id: partId, name: 'Second' })
  console.log('[07] rename to "Second" → result:', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.common.setObjectName({ id: partId, name: 'Third' })
  console.log('[07] rename to "Third" → result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Check final name in structure
  filewrite(r2.structure, 'structure-after-double-rename')

  return { partId }
}
