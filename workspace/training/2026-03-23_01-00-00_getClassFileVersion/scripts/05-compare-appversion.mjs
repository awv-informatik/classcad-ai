// Compare getClassFileVersion with getAppVersion — same shape?
export default async function (api) {
  const r1 = await api.v1.common.getClassFileVersion({})
  const r2 = await api.v1.common.getAppVersion({})

  console.log('[05] classFileVersion result:', JSON.stringify(r1.result))
  console.log('[05] appVersion result:', JSON.stringify(r2.result))
  console.log('[05] classFileVersion maxLevel:', r1.maxLevel)
  console.log('[05] appVersion maxLevel:', r2.maxLevel)
  console.log('[05] same envelope keys:', Object.keys(r1).join() === Object.keys(r2).join())
  console.log('[05] same result:', r1.result === r2.result)
  return { classFileVersion: r1.result, appVersion: r2.result }
}
