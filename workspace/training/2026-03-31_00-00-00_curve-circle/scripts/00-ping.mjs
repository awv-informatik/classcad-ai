export default async function (api) {
  const r = await api.v1.common.getAppVersion({})
  console.log('[00] version:', r.result, 'maxLevel:', r.maxLevel)
  return { version: r.result }
}
