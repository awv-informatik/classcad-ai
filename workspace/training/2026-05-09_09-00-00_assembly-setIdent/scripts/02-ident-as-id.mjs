export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'IdentAsIdTest' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.part.workCSys({
    id: tplId, name: 'WCS1',
    origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result
  console.log('[02] inst1:', inst1)

  // Set ident
  await api.v1.assembly.setIdent({ id: inst1, ident: 'box_a' })

  // Test 1: getInstance requires ownerId, so pass both
  const gi = await api.v1.assembly.getInstance({ id: 'box_a', ownerId: asmId })
  console.log('[02] getInstance by ident:', gi.result ? 'ok' : 'null', 'maxLevel:', gi.maxLevel)
  filewrite({ result: gi.result, messages: gi.messages, maxLevel: gi.maxLevel }, 'getInstance-ident')

  // Test 2: transformInstance by ident
  const tr = await api.v1.assembly.transformInstance({
    id: 'box_a',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]]
  })
  console.log('[02] transformInstance by ident:', tr.result, 'maxLevel:', tr.maxLevel)
  filewrite({ result: tr.result, messages: tr.messages, maxLevel: tr.maxLevel }, 'transformInstance-ident')

  // Test 3: transformInstanceTo by ident
  const tr2 = await api.v1.assembly.transformInstanceTo({
    id: 'box_a',
    transformation: [[100, 30, 0], [1, 0, 0], [0, 1, 0]]
  })
  console.log('[02] transformInstanceTo by ident:', tr2.result, 'maxLevel:', tr2.maxLevel)
  filewrite({ result: tr2.result, messages: tr2.messages, maxLevel: tr2.maxLevel }, 'transformInstanceTo-ident')

  // Test 4: deleteInstance by ident
  // First verify it's there
  const mp = await api.v1.assembly.calculateMassProperties({ id: 'box_a' })
  console.log('[02] massProps by ident:', mp.result ? 'ok' : 'null', 'maxLevel:', mp.maxLevel)
  filewrite({ result: mp.result, messages: mp.messages, maxLevel: mp.maxLevel }, 'massProps-ident')

  // Test 5: use ident as ownerId for creating a sub-instance
  // set ident on the assembly too
  await api.v1.assembly.setIdent({ id: asmId, ident: 'root_asm' })
  const inst2 = await api.v1.assembly.instance({
    productId: tplId, ownerId: 'root_asm', name: 'Inst2',
    transformation: [[0, 80, 0], [1, 0, 0], [0, 1, 0]]
  })
  console.log('[02] instance with ident ownerId:', inst2.result, 'maxLevel:', inst2.maxLevel)
  filewrite({ result: inst2.result, messages: inst2.messages, maxLevel: inst2.maxLevel }, 'instance-ident-owner')

  await snapshot('ident-as-id')

  return { asmId, inst1 }
}
