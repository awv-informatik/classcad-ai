export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OrderTest' })).result

  // Set keys in a specific order: z, a, m, b, y
  await api.v1.common.setUserData({ id: partId, key: 'z-last', value: '1' })
  await api.v1.common.setUserData({ id: partId, key: 'a-first', value: '2' })
  await api.v1.common.setUserData({ id: partId, key: 'm-middle', value: '3' })
  await api.v1.common.setUserData({ id: partId, key: 'b-second', value: '4' })
  await api.v1.common.setUserData({ id: partId, key: 'y-almost', value: '5' })

  const keys = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[02] insertion order: z-last, a-first, m-middle, b-second, y-almost')
  console.log('[02] returned order:', JSON.stringify(keys))
  console.log('[02] sorted would be:', JSON.stringify([...keys].sort()))
  console.log('[02] is sorted?', JSON.stringify(keys) === JSON.stringify([...keys].sort()))

  // Second part with numeric-prefix keys to further test ordering
  const partId2 = (await api.v1.part.create({ name: 'OrderTest2' })).result
  for (let i = 10; i >= 1; i--) {
    await api.v1.common.setUserData({ id: partId2, key: `key${i}`, value: `${i}` })
  }
  const keys2 = (await api.v1.common.getUserDataKeys({ id: partId2 })).result
  console.log('[02] numeric keys inserted 10→1:', JSON.stringify(keys2))
  console.log('[02] sorted would be:', JSON.stringify([...keys2].sort()))

  filewrite({ alphabeticKeys: keys, numericKeys: keys2 }, 'ordering')

  return { partId }
}
