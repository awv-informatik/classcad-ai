// Test: VOID result type — which APIs return VOID and what exactly is it?
export default async function (api) {
  // clear returns VOID
  const r1 = await api.v1.common.clear({})
  console.log(`[void] clear: result=${JSON.stringify(r1.result)} type=${typeof r1.result} ===null:${r1.result===null} ===undefined:${r1.result===undefined}`)

  // Create a part, then use VOID-returning APIs
  const partId = (await api.v1.part.create({ name: 'VoidTest' })).result

  const r2 = await api.v1.common.setObjectName({ id: partId, name: 'Renamed' })
  console.log(`[void] setObjectName: result=${JSON.stringify(r2.result)} type=${typeof r2.result} ===null:${r2.result===null}`)

  const r3 = await api.v1.common.setUserData({ id: partId, key: 'foo', value: 'bar' })
  console.log(`[void] setUserData: result=${JSON.stringify(r3.result)} type=${typeof r3.result} ===null:${r3.result===null}`)

  const r4 = await api.v1.common.removeUserData({ id: partId, key: 'foo' })
  console.log(`[void] removeUserData: result=${JSON.stringify(r4.result)} type=${typeof r4.result} ===null:${r4.result===null}`)

  const r5 = await api.v1.common.clearUserData({ id: partId })
  console.log(`[void] clearUserData: result=${JSON.stringify(r5.result)} type=${typeof r5.result} ===null:${r5.result===null}`)

  return {}
}
