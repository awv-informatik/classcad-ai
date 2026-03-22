// Follow-up: getUserDataKeys on empty part returned null, not []
// Is this the client unwrapping or the server? Also test other empty-array scenarios.
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'EmptyArr' }] })).result

  // getUserDataKeys with no keys set
  const r1 = await execute({ 'v1.common.getUserDataKeys': [{ id: partId }] })
  console.log(`[empty] getUserDataKeys(noKeys): result=${JSON.stringify(r1.result)} type=${typeof r1.result} isArray=${Array.isArray(r1.result)} ===null:${r1.result===null} maxLevel=${r1.maxLevel}`)

  // Add one key, then check
  await execute({ 'v1.common.setUserData': [{ id: partId, key: 'x', value: 'y' }] })
  const r2 = await execute({ 'v1.common.getUserDataKeys': [{ id: partId }] })
  console.log(`[empty] getUserDataKeys(oneKey): result=${JSON.stringify(r2.result)} type=${typeof r2.result} isArray=${Array.isArray(r2.result)}`)

  // Clear all keys, check again
  await execute({ 'v1.common.clearUserData': [{ id: partId }] })
  const r3 = await execute({ 'v1.common.getUserDataKeys': [{ id: partId }] })
  console.log(`[empty] getUserDataKeys(cleared): result=${JSON.stringify(r3.result)} type=${typeof r3.result} ===null:${r3.result===null}`)

  return {}
}
