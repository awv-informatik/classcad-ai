// Call without passing {} — does it still work?
export default async function (api) {
  const r1 = await api.v1.common.getAppVersion()
  const r2 = await api.v1.common.getAppVersion({})

  console.log('[02] no-arg result:', JSON.stringify(r1.result))
  console.log('[02] empty-obj result:', JSON.stringify(r2.result))
  console.log('[02] same result:', r1.result === r2.result)
  console.log('[02] no-arg maxLevel:', r1.maxLevel)
  console.log('[02] empty-obj maxLevel:', r2.maxLevel)

  return { noArg: r1.result, emptyObj: r2.result }
}
