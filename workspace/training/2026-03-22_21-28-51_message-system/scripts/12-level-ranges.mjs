// Q: Are 31, 41, 51 the only levels? What about failure detection: is maxLevel > 31 always bad?
// Let's try operations that partially succeed or have ambiguous outcomes.
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result

  // Create a box and try to set appearance with partial params
  const boxId = (await execute({ 'v1.part.box': [{ id: partId, xLen: 50, yLen: 50, zLen: 50 }] })).result

  // setAppearance with extra/unknown params
  const r1 = await execute({ 'v1.common.setAppearance': [{ target: boxId, color: [255, 0, 0], unknownParam: true }] })
  console.log('[12] extra param:', JSON.stringify({ result: r1.result, msgs: r1.messages, maxLevel: r1.maxLevel }))

  // setUserData — normal use
  const r2 = await execute({ 'v1.common.setUserData': [{ id: boxId, key: 'test', value: 'hello' }] })
  console.log('[12] setUserData success:', JSON.stringify({ result: r2.result, msgs: r2.messages, maxLevel: r2.maxLevel }))

  // getUserData — key that doesn't exist
  const r3 = await execute({ 'v1.common.getUserData': [{ id: boxId, key: 'nonexistent' }] })
  console.log('[12] getUserData missing key:', JSON.stringify({ result: r3.result, msgs: r3.messages, maxLevel: r3.maxLevel }))

  // recalc
  const r4 = await execute({ 'v1.common.recalc': [{}] })
  console.log('[12] recalc:', JSON.stringify({ result: r4.result, msgs: r4.messages, maxLevel: r4.maxLevel }))

  // batch with mixed success/failure
  const r5 = await execute({
    'v1.common.batch': [{
      calls: [
        { 'v1.common.getAppVersion': [{}] },
        { 'v1.part.box': [{}] }  // will fail (no id)
      ]
    }]
  })
  console.log('[12] batch mixed:', JSON.stringify({ result: r5.result, msgs: r5.messages, maxLevel: r5.maxLevel }, null, 2))
}
