export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvalidIdTest' })).result

  // Valid set for reference
  const validR = await api.v1.common.setUserData({ id: partId, key: 'ok', value: 'yes' })
  console.log('[07] valid id: maxLevel=', validR.maxLevel)

  // Invalid ID (9999)
  const invalidR = await api.v1.common.setUserData({ id: 9999, key: 'test', value: 'val' })
  console.log('[07] invalid id 9999: result=', invalidR.result, 'maxLevel=', invalidR.maxLevel)
  console.log('[07] invalid id messages:', JSON.stringify(invalidR.messages))

  // ID = 0
  const zeroR = await api.v1.common.setUserData({ id: 0, key: 'test', value: 'val' })
  console.log('[07] id=0: result=', zeroR.result, 'maxLevel=', zeroR.maxLevel)
  console.log('[07] id=0 messages:', JSON.stringify(zeroR.messages))

  // Negative ID
  const negR = await api.v1.common.setUserData({ id: -1, key: 'test', value: 'val' })
  console.log('[07] id=-1: result=', negR.result, 'maxLevel=', negR.maxLevel)
  console.log('[07] id=-1 messages:', JSON.stringify(negR.messages))

  // getUserData on invalid id
  const getInvalidR = await api.v1.common.getUserData({ id: 9999, key: 'test', defaultValue: 'default' })
  console.log('[07] getUserData invalid id: result=', JSON.stringify(getInvalidR.result), 'maxLevel=', getInvalidR.maxLevel)
  console.log('[07] getUserData invalid messages:', JSON.stringify(getInvalidR.messages))

  filewrite({
    valid: { maxLevel: validR.maxLevel },
    invalid9999: { result: invalidR.result, maxLevel: invalidR.maxLevel, messages: invalidR.messages },
    zero: { result: zeroR.result, maxLevel: zeroR.maxLevel, messages: zeroR.messages },
    negative: { result: negR.result, maxLevel: negR.maxLevel, messages: negR.messages },
    getInvalid: { result: getInvalidR.result, maxLevel: getInvalidR.maxLevel, messages: getInvalidR.messages },
  }, 'invalid-id')

  return { partId }
}
