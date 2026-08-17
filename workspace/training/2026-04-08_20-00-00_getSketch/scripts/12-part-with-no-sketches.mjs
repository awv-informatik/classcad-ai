// Test getSketch on a part that has no sketches at all
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyPart' })).result

  const r = await api.v1.part.getSketch({ id: partId, name: 'Anything' })
  console.log('[12] no-sketch part — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'no-sketches-response')

  return { partId }
}
