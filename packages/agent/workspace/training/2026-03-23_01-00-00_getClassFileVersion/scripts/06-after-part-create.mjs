// Call before and after part.create — unaffected by drawing state?
export default async function (api) {
  const before = await api.v1.common.getClassFileVersion({})
  console.log('[06] before part.create:', JSON.stringify(before.result), 'maxLevel:', before.maxLevel)

  const partId = (await api.v1.part.create({ name: 'Test' })).result
  console.log('[06] created part:', partId)

  const after = await api.v1.common.getClassFileVersion({})
  console.log('[06] after part.create:', JSON.stringify(after.result), 'maxLevel:', after.maxLevel)
  console.log('[06] same result:', before.result === after.result)

  return { before: before.result, after: after.result, same: before.result === after.result, partId }
}
