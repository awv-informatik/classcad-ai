// 14 — setObjectName on arc, and getObjectName to verify
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NameTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })).result

  // Set name
  const nr = await api.v1.common.setObjectName({ id: arcId, name: 'MyArc' })
  console.log('[14] setObjectName result:', nr.result, 'maxLevel:', nr.maxLevel)

  // Get name back
  const gn = await api.v1.common.getObjectName({ id: arcId })
  console.log('[14] getObjectName:', gn.result)

  return { partId }
}
