// 10 — Can we rename default planes (Top, Right, Front)?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DefPlane' })).result
  console.log('[10] partId:', partId)

  // Get the default Top plane by name
  const topR = await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })
  const topId = topR.result
  console.log('[10] Top plane id:', topId, 'maxLevel:', topR.maxLevel)

  if (topId) {
    // Rename it
    const r = await api.v1.common.setObjectName({ id: topId, name: 'MyTop' })
    console.log('[10] rename Top → MyTop: result:', r.result, 'maxLevel:', r.maxLevel)
    if (r.messages?.length) console.log('[10] messages:', JSON.stringify(r.messages))

    // Can we still find by old name?
    const oldLookup = await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })
    console.log('[10] lookup "Top" after rename:', oldLookup.result, 'maxLevel:', oldLookup.maxLevel)

    // Can we find by new name?
    const newLookup = await api.v1.part.getWorkGeometry({ id: partId, name: 'MyTop' })
    console.log('[10] lookup "MyTop" after rename:', newLookup.result, 'maxLevel:', newLookup.maxLevel)

    filewrite({
      topId,
      renameResult: r.result, renameMaxLevel: r.maxLevel, renameMessages: r.messages,
      oldNameLookup: { result: oldLookup.result, maxLevel: oldLookup.maxLevel },
      newNameLookup: { result: newLookup.result, maxLevel: newLookup.maxLevel }
    }, 'default-plane-rename')
  }

  return { partId }
}
