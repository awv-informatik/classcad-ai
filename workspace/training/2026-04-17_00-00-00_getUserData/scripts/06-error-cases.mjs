export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Case 1: nonexistent ID
  const r1 = await api.v1.common.getUserData({ id: 9999, key: 'test' })
  console.log('[06] nonexistent id=9999: result=', r1.result, 'maxLevel=', r1.maxLevel)

  // Case 2: id=0
  const r2 = await api.v1.common.getUserData({ id: 0, key: 'test' })
  console.log('[06] id=0: result=', r2.result, 'maxLevel=', r2.maxLevel)

  // Case 3: object with no user data set at all
  const r3 = await api.v1.common.getUserData({ id: partId, key: 'never-set' })
  console.log('[06] never-set key: result=', JSON.stringify(r3.result), 'maxLevel=', r3.maxLevel)

  // Case 4: getUserData with no key param (if possible)
  let r4 = null
  try {
    r4 = await api.v1.common.getUserData({ id: partId })
    console.log('[06] no key param: result=', r4.result, 'maxLevel=', r4.maxLevel)
  } catch (e) {
    console.log('[06] no key param: threw error:', e.message)
    r4 = { error: e.message }
  }

  filewrite({
    nonexistentId: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    zeroId: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
    neverSetKey: { result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel },
    noKeyParam: r4,
  }, 'error-cases')

  return { partId }
}
