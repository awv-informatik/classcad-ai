// Q: Is maxLevel always the highest level among messages? What is maxLevel when messages is empty?
export default async function ({ execute }) {
  // Case 1: no messages — maxLevel should be 31 (INFO baseline)
  const r1 = await execute({ 'v1.common.getAppVersion': [{}] })
  console.log('[11] no messages: maxLevel=', r1.maxLevel, 'messages.length=', r1.messages.length)

  // Case 2: only warnings
  // (hard to trigger warning-only — invalid ID produces warning + error)

  // Case 3: mixed warning + error
  const r3 = await execute({ 'v1.part.box': [{ id: 999999 }] })
  const levels3 = r3.messages.map(m => m.level)
  const max3 = Math.max(...levels3)
  console.log('[11] mixed msgs: maxLevel=', r3.maxLevel, 'individual levels:', levels3, 'computed max:', max3, 'match:', r3.maxLevel === max3)

  // Case 4: single error
  const r4 = await execute({ 'v1.part.box': [{}] })
  console.log('[11] single error: maxLevel=', r4.maxLevel, 'msg level:', r4.messages[0]?.level, 'match:', r4.maxLevel === r4.messages[0]?.level)

  // Case 5: create part (success, likely INFO messages filtered)
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result
  const r5 = await execute({ 'v1.part.box': [{ id: partId }] })
  console.log('[11] success box: maxLevel=', r5.maxLevel, 'messages.length=', r5.messages.length, 'result=', r5.result)
}
