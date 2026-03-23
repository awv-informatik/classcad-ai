// 01 — Inspect the raw envelope from two stateless APIs
// Question: What does the full { result, messages, maxLevel } envelope look like?

export default async function (api) {
  const appVersion = await api.v1.common.getAppVersion({})
  console.log('[envelope] getAppVersion:', JSON.stringify(appVersion, null, 2))

  const fileVersion = await api.v1.common.getClassFileVersion({})
  console.log('[envelope] getClassFileVersion:', JSON.stringify(fileVersion, null, 2))

  console.log('[keys] getAppVersion:', Object.keys(appVersion))
  console.log('[keys] getClassFileVersion:', Object.keys(fileVersion))
  console.log('[types] result:', typeof appVersion.result, '| messages:', typeof appVersion.messages, Array.isArray(appVersion.messages))
  console.log('[types] maxLevel:', typeof appVersion.maxLevel, appVersion.maxLevel)

  return {}
}
