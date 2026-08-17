// Call with no argument at all
export default async function (api) {
  const r = await api.v1.common.getClassFileVersion()
  console.log('[02] no-arg result:', JSON.stringify(r.result))
  console.log('[02] no-arg maxLevel:', r.maxLevel)
  return { result: r.result }
}
