// Wrong ID type — pass part ID instead of sketch ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WrongId' })).result

  const r = await api.v1.sketch.arcBy3Points({
    id: partId,
    startPos: [0, 0, 0],
    midPos: [20, 20, 0],
    endPos: [40, 0, 0],
  })
  console.log('[17] wrong id:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[17] msgs:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'wrong-id')

  return { partId }
}
