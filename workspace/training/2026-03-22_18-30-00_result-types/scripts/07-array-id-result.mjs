// Test: Array<id> and Array<string> result types
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'ArrayTest' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  // sketch.rectangle → Array<id>
  const r1 = await execute({
    'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [50, 50, 0] }],
  })
  console.log(`[array] rectangle: result=${JSON.stringify(r1.result)} isArray=${Array.isArray(r1.result)} length=${r1.result?.length} elementTypes=${r1.result?.map(v=>typeof v)}`)

  // getUserDataKeys → Array<string>
  await execute({ 'v1.common.setUserData': [{ id: partId, key: 'a', value: '1' }] })
  await execute({ 'v1.common.setUserData': [{ id: partId, key: 'b', value: '2' }] })
  await execute({ 'v1.common.setUserData': [{ id: partId, key: 'c', value: '3' }] })
  const r2 = await execute({ 'v1.common.getUserDataKeys': [{ id: partId }] })
  console.log(`[array] userDataKeys: result=${JSON.stringify(r2.result)} isArray=${Array.isArray(r2.result)} length=${r2.result?.length} elementTypes=${r2.result?.map(v=>typeof v)}`)

  // Empty array case — getUserDataKeys on part with no userData
  const p2 = (await execute({ 'v1.part.create': [{ name: 'NoKeys' }] })).result
  const r3 = await execute({ 'v1.common.getUserDataKeys': [{ id: p2 }] })
  console.log(`[array] emptyKeys: result=${JSON.stringify(r3.result)} isArray=${Array.isArray(r3.result)} length=${r3.result?.length}`)

  return {}
}
