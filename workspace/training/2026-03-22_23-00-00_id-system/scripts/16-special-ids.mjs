// Q: What are IDs 1 (AllObjects) and 50? Can you use ID 1 in APIs? What's special about it?
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result

  // ID 1 = AllObjects — try using it
  const r1 = await execute({ 'v1.common.setObjectName': [{ id: 1, name: 'RenameAll' }] })
  console.log('[16] setObjectName on id=1:', r1.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r1.maxLevel)

  // ID 50 — mystery child of AllObjects, not in tree
  const r2 = await execute({ 'v1.common.setObjectName': [{ id: 50, name: 'WhatAreYou' }] })
  console.log('[16] setObjectName on id=50:', r2.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages?.map(m => m.message)))

  // ID 2 and 3 — do they exist?
  const r3 = await execute({ 'v1.common.setObjectName': [{ id: 2, name: 'Id2' }] })
  console.log('[16] setObjectName on id=2:', r3.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r3.maxLevel)

  const r4 = await execute({ 'v1.common.setObjectName': [{ id: 3, name: 'Id3' }] })
  console.log('[16] setObjectName on id=3:', r4.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r4.maxLevel)

  // Try setUserData on AllObjects (id=1)
  const r5 = await execute({ 'v1.common.setUserData': [{ id: 1, key: 'test', value: 'allobj' }] })
  console.log('[16] setUserData on id=1:', r5.maxLevel <= 31 ? '✓' : '❌')

  // Try getUserData on id=1
  const r6 = await execute({ 'v1.common.getUserData': [{ id: 1, key: 'test' }] })
  console.log('[16] getUserData from id=1:', r6.result)

  // What about ID 0?
  const r7 = await execute({ 'v1.common.setObjectName': [{ id: 0, name: 'Id0' }] })
  console.log('[16] setObjectName on id=0:', r7.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r7.maxLevel)

  // What is structure.currentInstance = 0 about?
  const tree = (await execute({ 'v1.common.getAppVersion': [{}] })).structure
  console.log('[16] structure.root:', tree?.root, 'currentProduct:', tree?.currentProduct, 'currentInstance:', tree?.currentInstance, 'testRoot:', tree?.testRoot)
}
