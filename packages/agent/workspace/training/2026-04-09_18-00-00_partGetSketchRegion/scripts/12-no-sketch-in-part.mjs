// Part with no sketches at all — what error do we get?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyPart' })).result

  // No sketches created, just a bare part
  const r = await api.v1.part.getSketchRegion({ id: partId, name: 'Anything' })
  console.log('[12] no-sketch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))

  filewrite({
    result: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
  }, 'no-sketch')

  return { partId }
}
