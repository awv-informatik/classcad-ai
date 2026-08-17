// Quick health check — is the server alive?
export default async function (api, { snapshot, filewrite }) {
  const r = await api.v1.common.getAppVersion({})
  console.log('[14b] version:', r.result, 'maxLevel:', r.maxLevel)
  return { version: r.result }
}
