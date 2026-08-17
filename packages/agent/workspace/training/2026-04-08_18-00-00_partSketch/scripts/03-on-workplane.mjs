// 03 — part.sketch on a custom work plane
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a work plane offset along Z
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    normal: [0, 0, 1],
    position: [0, 0, 50],
  })).result
  console.log('[03] workPlane id:', wpId)

  const r = await api.v1.part.sketch({ id: partId, planeId: wpId, name: 'OnWP' })
  console.log('[03] part.sketch result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite(r.structure, 'structure-on-workplane')

  await snapshot('sketch-on-workplane')
  return { partId, sketchId: r.result, wpId }
}
