// Test: string result type — what APIs return strings? What content?
export default async function (api) {
  const r1 = await api.v1.common.getAppVersion({})
  console.log(`[string] getAppVersion: result=${JSON.stringify(r1.result)} type=${typeof r1.result} length=${r1.result?.length}`)

  const r2 = await api.v1.common.getClassFileVersion({})
  console.log(`[string] getClassFileVersion: result=${JSON.stringify(r2.result)} type=${typeof r2.result} length=${r2.result?.length}`)

  // getUserData → string
  const partId = (await api.v1.part.create({ name: 'StrTest' })).result
  await api.v1.common.setUserData({ id: partId, key: 'testKey', value: 'hello world' })
  const r3 = await api.v1.common.getUserData({ id: partId, key: 'testKey' })
  console.log(`[string] getUserData: result=${JSON.stringify(r3.result)} type=${typeof r3.result}`)

  // Empty string value
  await api.v1.common.setUserData({ id: partId, key: 'empty', value: '' })
  const r4 = await api.v1.common.getUserData({ id: partId, key: 'empty' })
  console.log(`[string] getUserData(empty): result=${JSON.stringify(r4.result)} type=${typeof r4.result} ==="":${r4.result===''}`)

  // Nonexistent key — what happens?
  const r5 = await api.v1.common.getUserData({ id: partId, key: 'nope' })
  console.log(`[string] getUserData(missing): result=${JSON.stringify(r5.result)} type=${typeof r5.result} ===null:${r5.result===null} maxLevel=${r5.maxLevel}`)

  // Unicode
  await api.v1.common.setUserData({ id: partId, key: 'unicode', value: 'äöü 你好 🔧' })
  const r6 = await api.v1.common.getUserData({ id: partId, key: 'unicode' })
  console.log(`[string] getUserData(unicode): result=${JSON.stringify(r6.result)} type=${typeof r6.result}`)

  return {}
}
