export default async function (api, { filewrite }) {
  // Try to create assembly template without assembly.create first
  const r = await api.v1.assembly.assemblyTemplate({ name: 'Orphan' })
  console.log('[09] assemblyTemplate without assembly.create:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-assembly-error')

  return { result: r.result }
}
