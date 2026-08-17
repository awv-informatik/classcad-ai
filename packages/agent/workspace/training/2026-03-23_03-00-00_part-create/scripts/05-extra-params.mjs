// Extra/unknown params — silently ignored?
export default async function (api) {
  const r = await api.v1.part.create({ name: 'ExtraTest', foo: 'bar', id: 999 })
  console.log('[05] result:', r.result)
  console.log('[05] maxLevel:', r.maxLevel)
  return { partId: r.result }
}
