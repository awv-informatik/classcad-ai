export default async function (api, { filewrite }) {
  // Try calling partTemplate WITHOUT assembly.create first
  const r = await api.v1.assembly.partTemplate({ name: 'Orphan' })
  console.log('[04] partTemplate without assembly.create - result:', r.result)
  console.log('[04] maxLevel:', r.maxLevel)
  if (r.messages?.length > 0) {
    console.log('[04] messages:', JSON.stringify(r.messages))
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'without-assembly')

  return { tplId: r.result }
}
