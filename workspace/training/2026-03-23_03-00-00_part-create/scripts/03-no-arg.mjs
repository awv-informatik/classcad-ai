// part.create with no argument at all
export default async function (api) {
  const r = await api.v1.part.create()
  console.log('[03] result:', r.result)
  console.log('[03] maxLevel:', r.maxLevel)
  return { partId: r.result }
}
