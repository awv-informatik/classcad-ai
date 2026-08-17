// 14 — Is dedup scoped to siblings or global?
// Rename a part feature to the same name as a built-in (e.g. "Origin")
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'MyFeature' })).result
  console.log('[14] partId:', partId, 'eifId:', eifId)

  // Try naming the EIF "Origin" — which already exists as a built-in work geo
  const r = await api.v1.common.setObjectName({ id: eifId, name: 'Origin' })
  console.log('[14] rename eif → "Origin": maxLevel:', r.maxLevel)

  // Check what it actually became
  const targets = new Set([eifId, 22]) // 22 is typically the Origin
  function findNames(obj) {
    const results = []
    if (!obj) return results
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      if (targets.has(obj.id)) results.push({ id: obj.id, name: obj.name })
      for (const v of Object.values(obj)) results.push(...findNames(v))
    }
    if (Array.isArray(obj)) for (const v of obj) results.push(...findNames(v))
    return results
  }

  const names = findNames(r.structure)
  console.log('[14] names:', JSON.stringify(names))
  filewrite(names, 'dedup-scope')

  return { partId }
}
