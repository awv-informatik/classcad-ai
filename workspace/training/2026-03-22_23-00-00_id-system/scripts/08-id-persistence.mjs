// Q: Do IDs persist/remain stable across multiple calls? Can you reuse them?
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result
  const boxId = (await execute({ 'v1.part.box': [{ id: partId, name: 'Box1' }] })).result
  console.log('[08] partId:', partId, 'boxId:', boxId)

  // Use partId again to create another feature — does the same partId still work?
  const cylId = (await execute({ 'v1.part.cylinder': [{ id: partId, name: 'Cyl1' }] })).result
  console.log('[08] cylId:', cylId, '(partId still works:', cylId !== null, ')')

  // Use setObjectName with the part ID
  const r1 = await execute({ 'v1.common.setObjectName': [{ id: partId, name: 'RenamedPart' }] })
  console.log('[08] setObjectName on partId:', r1.maxLevel <= 31 ? '✓' : '❌')

  // Use setObjectName with the box feature ID
  const r2 = await execute({ 'v1.common.setObjectName': [{ id: boxId, name: 'RenamedBox' }] })
  console.log('[08] setObjectName on boxId:', r2.maxLevel <= 31 ? '✓' : '❌')

  // Use setObjectName on the cylinder ID
  const r3 = await execute({ 'v1.common.setObjectName': [{ id: cylId, name: 'RenamedCyl' }] })
  console.log('[08] setObjectName on cylId:', r3.maxLevel <= 31 ? '✓' : '❌')

  // Can we set user data on any object?
  const r4 = await execute({ 'v1.common.setUserData': [{ id: boxId, key: 'test', value: 'hello' }] })
  console.log('[08] setUserData on feature:', r4.maxLevel <= 31 ? '✓' : '❌')

  const r5 = await execute({ 'v1.common.getUserData': [{ id: boxId, key: 'test' }] })
  console.log('[08] getUserData from feature:', r5.result)
}
