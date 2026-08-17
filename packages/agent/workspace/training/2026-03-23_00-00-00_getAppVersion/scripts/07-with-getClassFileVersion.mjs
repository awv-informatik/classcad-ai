// Compare with getClassFileVersion — are they different APIs returning different things?
export default async function (api) {
  const r1 = await api.v1.common.getAppVersion({})
  const r2 = await api.v1.common.getClassFileVersion({})

  console.log('[07] appVersion:', JSON.stringify(r1.result))
  console.log('[07] classFileVersion:', JSON.stringify(r2.result))
  console.log('[07] same?', r1.result === r2.result)
  console.log('[07] appVersion type:', typeof r1.result)
  console.log('[07] classFileVersion type:', typeof r2.result)

  return { appVersion: r1.result, classFileVersion: r2.result }
}
