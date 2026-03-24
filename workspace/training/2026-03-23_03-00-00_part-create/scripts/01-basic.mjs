// Basic part.create with name — inspect full envelope
export default async function (api, { filewrite }) {
  const r = await api.v1.part.create({ name: 'TestPart' })
  console.log('[01] result:', r.result)
  console.log('[01] result type:', typeof r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  console.log('[01] envelope keys:', Object.keys(r).join(', '))
  console.log('[01] structure keys:', Object.keys(r.structure).join(', '))
  console.log('[01] structure tree node count:', Object.keys(r.structure.tree).length)
  filewrite(r.structure, 'structure')
  return { partId: r.result }
}
