export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Try to find and delete built-in origin work geometry
  const topPlane = await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })
  console.log('[14] Top plane lookup — result:', topPlane.result, 'maxLevel:', topPlane.maxLevel)

  if (topPlane.result) {
    const r = await api.v1.part.deleteFeature({ ids: [topPlane.result] })
    console.log('[14] delete Top plane — result:', r.result, 'maxLevel:', r.maxLevel)
    console.log('[14] messages:', JSON.stringify(r.messages))

    filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'delete-builtin')
  } else {
    console.log('[14] Top plane not found, skipping')
  }

  return { partId }
}
