// 15 — Rename to the same name it already has (no-op?)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'KeepName' })).result
  console.log('[15] partId:', partId)

  const r = await api.v1.common.setObjectName({ id: partId, name: 'KeepName' })
  console.log('[15] rename to same name → result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[15] messages:', JSON.stringify(r.messages))

  // Verify still has original name
  function findId(obj, targetId) {
    if (!obj) return null
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      if (obj.id === targetId) return obj.name
      for (const v of Object.values(obj)) { const r = findId(v, targetId); if (r) return r }
    }
    if (Array.isArray(obj)) for (const v of obj) { const r = findId(v, targetId); if (r) return r }
    return null
  }
  console.log('[15] name after:', findId(r.structure, partId))

  return { partId }
}
