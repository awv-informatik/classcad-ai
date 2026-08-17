// Does getAppVersion change after creating geometry?
export default async function (api) {
  const v1 = (await api.v1.common.getAppVersion({})).result

  // Create a part
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  console.log('[09] partId:', partId)

  const v2 = (await api.v1.common.getAppVersion({})).result

  console.log('[09] before part.create:', JSON.stringify(v1))
  console.log('[09] after part.create:', JSON.stringify(v2))
  console.log('[09] same?', v1 === v2)

  return { before: v1, after: v2, partId }
}
