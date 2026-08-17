export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ObjTypeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  console.log('[05] partId:', partId, 'eifId:', eifId, 'boxId:', boxId, 'skId:', skId)

  // Test user data on each object type
  const targets = [
    { name: 'part', id: partId },
    { name: 'entityInjection', id: eifId },
    { name: 'solid', id: boxId },
    { name: 'sketch', id: skId },
  ]

  const results = {}
  for (const t of targets) {
    const setR = await api.v1.common.setUserData({ id: t.id, key: 'testKey', value: 'testVal' })
    const getR = await api.v1.common.getUserData({ id: t.id, key: 'testKey' })
    const keysR = await api.v1.common.getUserDataKeys({ id: t.id })
    results[t.name] = {
      id: t.id,
      setMaxLevel: setR.maxLevel,
      setMessages: setR.messages,
      getValue: getR.result,
      keys: keysR.result,
    }
    console.log('[05]', t.name, '(id=' + t.id + '):', setR.maxLevel <= 31 ? '✓' : '❌',
      'get=', getR.result, 'keys=', keysR.result)
  }

  // Also try with an invalid/bogus ID
  const bogusR = await api.v1.common.setUserData({ id: 9999, key: 'test', value: 'test' })
  console.log('[05] bogus id:', bogusR.maxLevel, JSON.stringify(bogusR.messages))
  results.bogusId = { maxLevel: bogusR.maxLevel, messages: bogusR.messages }

  filewrite(results, 'object-type-results')

  return { partId }
}
