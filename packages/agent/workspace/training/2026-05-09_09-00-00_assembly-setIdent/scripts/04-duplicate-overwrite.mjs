export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'DupTest' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[04] inst1:', inst1, 'inst2:', inst2)

  // Set idents
  await api.v1.assembly.setIdent({ id: inst1, ident: 'alpha' })
  await api.v1.assembly.setIdent({ id: inst2, ident: 'beta' })

  // Test 1: duplicate ident — set inst2 to same ident as inst1
  const dup = await api.v1.assembly.setIdent({ id: inst2, ident: 'alpha' })
  console.log('[04] duplicate ident result:', dup.result, 'maxLevel:', dup.maxLevel)
  filewrite({ result: dup.result, messages: dup.messages, maxLevel: dup.maxLevel }, 'duplicate-ident')

  // Test 2: overwrite ident — change inst1's ident
  const ow = await api.v1.assembly.setIdent({ id: inst1, ident: 'gamma' })
  console.log('[04] overwrite ident result:', ow.result, 'maxLevel:', ow.maxLevel)
  filewrite({ result: ow.result, messages: ow.messages, maxLevel: ow.maxLevel }, 'overwrite-ident')

  // Test 3: verify old ident no longer works after overwrite
  const gi_old = await api.v1.assembly.getInstance({ id: 'alpha', ownerId: asmId })
  console.log('[04] getInstance old ident (alpha):', gi_old.result, 'maxLevel:', gi_old.maxLevel)
  filewrite({ result: gi_old.result, messages: gi_old.messages, maxLevel: gi_old.maxLevel }, 'old-ident-lookup')

  // Test 4: verify new ident works
  const gi_new = await api.v1.assembly.getInstance({ id: 'gamma', ownerId: asmId })
  console.log('[04] getInstance new ident (gamma):', gi_new.result, 'maxLevel:', gi_new.maxLevel)
  filewrite({ result: gi_new.result, messages: gi_new.messages, maxLevel: gi_new.maxLevel }, 'new-ident-lookup')

  // Test 5: clear ident — set to empty string
  const clr = await api.v1.assembly.setIdent({ id: inst1, ident: '' })
  console.log('[04] clear ident result:', clr.result, 'maxLevel:', clr.maxLevel)
  filewrite({ result: clr.result, messages: clr.messages, maxLevel: clr.maxLevel }, 'clear-ident')

  // Test 6: verify cleared ident — lookup should fail
  const gi_clr = await api.v1.assembly.getInstance({ id: 'gamma', ownerId: asmId })
  console.log('[04] getInstance cleared ident (gamma):', gi_clr.result, 'maxLevel:', gi_clr.maxLevel)
  filewrite({ result: gi_clr.result, messages: gi_clr.messages, maxLevel: gi_clr.maxLevel }, 'cleared-ident-lookup')

  return { asmId, inst1, inst2 }
}
