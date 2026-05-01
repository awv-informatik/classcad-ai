export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GearAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'W1' })).result
  await api.v1.part.cylinder({ id: tpl1, name: 'C', height: 10, diameter: 40 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'W2' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'C', height: 10, diameter: 20 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'W3' })).result
  await api.v1.part.cylinder({ id: tpl3, name: 'C', height: 10, diameter: 30 })
  const wcs3 = (await api.v1.part.workCSys({ id: tpl3, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2', transformation: [[30,0,0],[1,0,0],[0,1,0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'I3', transformation: [[-35,0,0],[1,0,0],[0,1,0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })
  const rev1 = (await api.v1.assembly.revolute({ id: asmId, name: 'R1', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst2], csys: wcs2 } })).result
  const rev2 = (await api.v1.assembly.revolute({ id: asmId, name: 'R2', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst3], csys: wcs3 } })).result

  // Create a fastened constraint for non-revolute testing
  const fastId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result

  const gearId = (await api.v1.assembly.gear({ id: asmId, name: 'G1', constr1Id: rev1, constr2Id: rev2, ratio: 1 })).result

  // Error 1: pass assembly ID instead of gear ID
  const err1 = await api.v1.assembly.updateGear({ id: asmId, ratio: 5 })
  console.log('[06] assembly ID as gear ID — result:', err1.result, 'maxLevel:', err1.maxLevel)
  if (err1.messages?.length) console.log('[06] error msg:', err1.messages[0].message, 'code:', err1.messages[0].code)

  // Error 2: pass nonexistent ID
  const err2 = await api.v1.assembly.updateGear({ id: 99999, ratio: 5 })
  console.log('[06] nonexistent ID — result:', err2.result, 'maxLevel:', err2.maxLevel)
  if (err2.messages?.length) console.log('[06] error msg:', err2.messages[0].message, 'code:', err2.messages[0].code)

  // Error 3: pass a revolute constraint ID (not a gear ID)
  const err3 = await api.v1.assembly.updateGear({ id: rev1, ratio: 5 })
  console.log('[06] revolute ID as gear ID — result:', err3.result, 'maxLevel:', err3.maxLevel)
  if (err3.messages?.length) console.log('[06] error msg:', err3.messages[0].message, 'code:', err3.messages[0].code)

  // Error 4: try to set constr1Id to a non-revolute constraint
  const err4 = await api.v1.assembly.updateGear({ id: gearId, constr1Id: fastId })
  console.log('[06] fastened as constr1Id — result:', err4.result, 'maxLevel:', err4.maxLevel)
  if (err4.messages?.length) console.log('[06] error msg:', err4.messages[0].message, 'code:', err4.messages[0].code)

  // Error 5: missing id parameter entirely
  const err5 = await api.v1.assembly.updateGear({ ratio: 5 })
  console.log('[06] missing id — result:', err5.result, 'maxLevel:', err5.maxLevel)
  if (err5.messages?.length) console.log('[06] error msg:', err5.messages[0].message, 'code:', err5.messages[0].code)

  // Verify gear is unchanged after all failed updates
  const verify = (await api.v1.assembly.getGear({ id: asmId, name: 'G1' })).result
  console.log('[06] gear after errors — ratio:', verify.ratio, 'offset:', verify.offset, '(should be 1, 0)')

  filewrite({ err1: { result: err1.result, messages: err1.messages, maxLevel: err1.maxLevel },
              err2: { result: err2.result, messages: err2.messages, maxLevel: err2.maxLevel },
              err3: { result: err3.result, messages: err3.messages, maxLevel: err3.maxLevel },
              err4: { result: err4.result, messages: err4.messages, maxLevel: err4.maxLevel },
              err5: { result: err5.result, messages: err5.messages, maxLevel: err5.maxLevel },
              verify }, 'error-cases')

  return { gearId }
}
