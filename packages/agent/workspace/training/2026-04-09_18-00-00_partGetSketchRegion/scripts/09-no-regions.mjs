// No regions at all in the part: does it behave the same as not-found?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  const r = await api.v1.part.getSketchRegion({ id: partId, name: 'Anything' })
  console.log('[09] no-regions result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))

  filewrite({
    result: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
  }, 'no-regions')

  return { partId }
}
