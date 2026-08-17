// 13 — Name deduplication behavior
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const eif1 = (await api.v1.part.entityInjection({ id: partId, name: 'Foo' })).result
  const eif2 = (await api.v1.part.entityInjection({ id: partId, name: 'Bar' })).result
  const eif3 = (await api.v1.part.entityInjection({ id: partId, name: 'Baz' })).result
  console.log('[13] eif1:', eif1, 'eif2:', eif2, 'eif3:', eif3)

  // Rename eif2 to "Foo" (same as eif1)
  const r1 = await api.v1.common.setObjectName({ id: eif2, name: 'Foo' })
  console.log('[13] rename eif2 → "Foo": maxLevel:', r1.maxLevel)

  // Rename eif3 to "Foo" (now third with that name)
  const r2 = await api.v1.common.setObjectName({ id: eif3, name: 'Foo' })
  console.log('[13] rename eif3 → "Foo": maxLevel:', r2.maxLevel)

  // Check final names
  const targets = new Set([eif1, eif2, eif3])
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

  const names = findNames(r2.structure)
  console.log('[13] final names:', JSON.stringify(names))
  filewrite(names, 'dedup-names')

  return { partId }
}
