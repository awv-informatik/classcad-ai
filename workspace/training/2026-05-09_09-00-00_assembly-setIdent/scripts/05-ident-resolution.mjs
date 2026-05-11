export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'IdentResolve' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  const wcsId = (await api.v1.part.workCSys({
    id: tplId, name: 'WCS1',
    origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  // Set idents
  await api.v1.assembly.setIdent({ id: inst1, ident: 'alpha' })
  await api.v1.assembly.setIdent({ id: inst2, ident: 'beta' })
  await api.v1.assembly.setIdent({ id: asmId, ident: 'root' })
  await api.v1.assembly.setIdent({ id: tplId, ident: 'box_tpl' })

  // Test 1: transformInstance with ident (already shown to work)
  const tr = await api.v1.assembly.transformInstance({
    id: 'alpha',
    transformation: [[1, 0, 0, 30], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
  })
  console.log('[05] transformInstance(alpha):', tr.result, 'maxLevel:', tr.maxLevel)
  filewrite({ result: tr.result, messages: tr.messages }, 'transformInstance-alpha')

  // Test 2: transformInstanceTo with ident
  const tr2 = await api.v1.assembly.transformInstanceTo({
    id: 'alpha',
    transformation: [[1, 0, 0, 50], [0, 1, 0, 20], [0, 0, 1, 0], [0, 0, 0, 1]]
  })
  console.log('[05] transformInstanceTo(alpha):', tr2.result, 'maxLevel:', tr2.maxLevel)
  filewrite({ result: tr2.result, messages: tr2.messages }, 'transformInstanceTo-alpha')

  // Test 3: instance with ident as productId
  const inst3 = await api.v1.assembly.instance({
    productId: 'box_tpl', ownerId: 'root', name: 'Inst3',
    transformation: [[0, 80, 0], [1, 0, 0], [0, 1, 0]]
  })
  console.log('[05] instance(ident productId + ownerId):', inst3.result, 'maxLevel:', inst3.maxLevel)
  filewrite({ result: inst3.result, messages: inst3.messages }, 'instance-ident-both')

  // Test 4: deleteInstance with ident
  const del = await api.v1.assembly.deleteInstance({ ids: ['beta'] })
  console.log('[05] deleteInstance(beta):', del.result, 'maxLevel:', del.maxLevel)
  filewrite({ result: del.result, messages: del.messages }, 'deleteInstance-ident')

  // Test 5: setCurrentProduct with ident
  const scp = await api.v1.assembly.setCurrentProduct({ id: 'root' })
  console.log('[05] setCurrentProduct(root):', scp.result, 'maxLevel:', scp.maxLevel)
  filewrite({ result: scp.result, messages: scp.messages }, 'setCurrentProduct-ident')

  // Test 6: setCurrentInstance with ident
  const sci = await api.v1.assembly.setCurrentInstance({ id: 'alpha' })
  console.log('[05] setCurrentInstance(alpha):', sci.result, 'maxLevel:', sci.maxLevel)
  filewrite({ result: sci.result, messages: sci.messages }, 'setCurrentInstance-ident')

  // Test 7: fastenedOrigin — mate1.path and mate1.csys and instance param with idents
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const fo = await api.v1.assembly.fastenedOrigin({
    id: asmId,
    instance: inst1,  // numeric id
    name: 'FO1',
    mate1: { path: [inst1], csys: wcsId }  // numeric IDs — known to work
  })
  console.log('[05] fastenedOrigin(numeric):', fo.result, 'maxLevel:', fo.maxLevel)

  // Test 8: deleteConstraint with ident
  await api.v1.assembly.setIdent({ id: fo.result, ident: 'fo_alpha' })
  const dc = await api.v1.assembly.deleteConstraint({ ids: ['fo_alpha'] })
  console.log('[05] deleteConstraint(ident):', dc.result, 'maxLevel:', dc.maxLevel)
  filewrite({ result: dc.result, messages: dc.messages }, 'deleteConstraint-ident')

  // Verify positions
  const mp1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  const mp3 = await api.v1.assembly.calculateMassProperties({ id: inst3.result })
  console.log('[05] inst1 COG:', mp1.result?.centerOfGravity)
  console.log('[05] inst3 COG:', mp3.result?.centerOfGravity)

  await snapshot('ident-resolution')

  return { asmId }
}
