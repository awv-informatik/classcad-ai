export default async function (api, { filewrite }) {
  // Create a part with a solid
  const partId = (await api.v1.part.create({ name: 'ObjTypes' })).result
  const boxId = (await api.v1.solid.box({ id: partId, xLen: 50, yLen: 50, zLen: 50 })).result

  // Set user data on both part and solid
  await api.v1.common.setUserData({ id: partId, key: 'tag', value: 'part-tag' })
  await api.v1.common.setUserData({ id: boxId, key: 'tag', value: 'box-tag' })

  // Verify both are set
  const partTag = (await api.v1.common.getUserData({ id: partId, key: 'tag' })).result
  const boxTag = (await api.v1.common.getUserData({ id: boxId, key: 'tag' })).result
  console.log('[06] before remove — part:', partTag, 'box:', boxTag)

  // Remove from part only
  const rPart = await api.v1.common.removeUserData({ id: partId, key: 'tag' })
  console.log('[06] remove from part — maxLevel:', rPart.maxLevel)

  // Verify: part key gone, box key still there
  const partAfter = (await api.v1.common.getUserData({ id: partId, key: 'tag', defaultValue: '__GONE__' })).result
  const boxAfter = (await api.v1.common.getUserData({ id: boxId, key: 'tag' })).result
  console.log('[06] after remove — part:', partAfter, 'box:', boxAfter)

  filewrite({ partBefore: partTag, boxBefore: boxTag, partAfter, boxAfter }, 'object-isolation')

  return { partId }
}
