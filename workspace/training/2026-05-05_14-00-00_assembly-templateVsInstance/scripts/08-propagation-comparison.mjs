export default async function (api, { snapshot, filewrite }) {
  // Direct comparison: modify via template context vs via instance context
  // Question: does setCurrentProduct target affect propagation to instances?

  const asmId = (await api.v1.assembly.create({ name: 'PropTest' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  // STEP A: Modify via TEMPLATE context (setCurrentProduct to template)
  console.log('[08] === STEP A: modify via template context ===')
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, height: 20 })
  await api.v1.part.closeFeature({ id: boxId })
  await api.v1.common.recalc({})

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const mA_tpl = await api.v1.assembly.calculateMassProperties({ id: tplId })
  const mA_i1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  const mA_i2 = await api.v1.assembly.calculateMassProperties({ id: inst2 })
  console.log('[08] A — template volume:', mA_tpl.result?.volume)
  console.log('[08] A — inst1 volume:', mA_i1.result?.volume)
  console.log('[08] A — inst2 volume:', mA_i2.result?.volume)

  // STEP B: Modify via INSTANCE context (setCurrentProduct to instance)
  console.log('[08] === STEP B: modify via instance context ===')
  await api.v1.assembly.setCurrentProduct({ id: inst1 })
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, height: 30 })
  await api.v1.part.closeFeature({ id: boxId })
  await api.v1.common.recalc({})

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const mB_tpl = await api.v1.assembly.calculateMassProperties({ id: tplId })
  const mB_i1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  const mB_i2 = await api.v1.assembly.calculateMassProperties({ id: inst2 })
  console.log('[08] B — template volume:', mB_tpl.result?.volume)
  console.log('[08] B — inst1 volume:', mB_i1.result?.volume)
  console.log('[08] B — inst2 volume:', mB_i2.result?.volume)

  filewrite({
    stepA_viaTemplate: { tplVol: mA_tpl.result?.volume, inst1Vol: mA_i1.result?.volume, inst2Vol: mA_i2.result?.volume },
    stepB_viaInstance: { tplVol: mB_tpl.result?.volume, inst1Vol: mB_i1.result?.volume, inst2Vol: mB_i2.result?.volume }
  }, 'propagation-comparison')

  await snapshot('propagation-test')
  return { asmId, tplId, inst1, inst2 }
}
