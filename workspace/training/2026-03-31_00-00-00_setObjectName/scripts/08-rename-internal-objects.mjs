// 08 — Try renaming internal/system objects (ExpressionSet, Origin, etc.)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  console.log('[08] partId:', partId)

  // From structure, internal objects have known IDs relative to partId
  // Origin is typically partId + 18 (id=22 when partId=4)
  // Let's just try a few known internal IDs
  // We'll get structure first to find them
  const structR = await api.v1.common.getAppVersion({})
  const struct = structR.structure

  // Extract some internal object IDs from structure
  const internalNames = []
  function findInternals(obj) {
    if (!obj) return
    if (typeof obj === 'object' && obj.name && obj.id) {
      if (['ExpressionSet', 'Origin', 'XAxis', 'Top'].includes(obj.name)) {
        internalNames.push({ id: obj.id, name: obj.name })
      }
    }
    if (Array.isArray(obj)) obj.forEach(findInternals)
    else if (typeof obj === 'object') Object.values(obj).forEach(findInternals)
  }
  findInternals(struct)
  console.log('[08] found internals:', JSON.stringify(internalNames))

  // Try renaming each
  const results = []
  for (const { id, name } of internalNames) {
    const r = await api.v1.common.setObjectName({ id, name: `Renamed_${name}` })
    console.log(`[08] rename ${name} (id=${id}) → result:${r.result} maxLevel:${r.maxLevel}`)
    if (r.messages?.length) console.log(`[08]   messages:`, JSON.stringify(r.messages))
    results.push({ originalName: name, id, result: r.result, maxLevel: r.maxLevel, messages: r.messages })
  }

  filewrite(results, 'internal-rename-results')

  // Get final structure to see if names changed
  const finalR = await api.v1.common.getAppVersion({})
  filewrite(finalR.structure, 'structure-after-internal-rename')

  return { partId }
}
