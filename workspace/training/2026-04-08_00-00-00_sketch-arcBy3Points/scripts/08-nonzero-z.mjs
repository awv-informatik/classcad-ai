// Non-zero Z — sketch geometry should reject non-zero Z
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 0, 5],
    midPos: [20, 20, 5],
    endPos: [40, 0, 5],
  })
  console.log('[08] non-zero Z:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] msgs:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'nonzero-z')

  return { partId }
}
