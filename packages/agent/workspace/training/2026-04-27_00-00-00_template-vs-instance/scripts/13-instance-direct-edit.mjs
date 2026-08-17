export default async function (api, { snapshot, filewrite }) {
  // Test: can we add features directly to an instance?
  const asmId = (await api.v1.assembly.create({ name: 'DirectEditTest' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Inst2',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Try part.box with instance ID as the id param
  const tryBox = await api.v1.part.box({ id: inst1, name: 'InstBox', length: 10, width: 10, height: 50 })
  console.log('[13] part.box(inst1):', tryBox.maxLevel, tryBox.result)
  if (tryBox.messages?.length) {
    console.log('[13] messages:', tryBox.messages.map(m => m.message))
  }

  // Try part.cylinder on the instance
  const tryCyl = await api.v1.part.cylinder({ id: inst1, name: 'InstCyl', height: 30, diameter: 10 })
  console.log('[13] part.cylinder(inst1):', tryCyl.maxLevel, tryCyl.result)
  if (tryCyl.messages?.length) {
    console.log('[13] messages:', tryCyl.messages.map(m => m.message))
  }

  // Try entityInjection on the instance
  const tryEI = await api.v1.part.entityInjection({ id: inst1, name: 'InstEI' })
  console.log('[13] entityInjection(inst1):', tryEI.maxLevel, tryEI.result)
  if (tryEI.messages?.length) {
    console.log('[13] messages:', tryEI.messages.map(m => m.message))
  }

  // Try sketch on instance
  const trySk = await api.v1.part.sketch({ id: inst1, name: 'InstSketch' })
  console.log('[13] sketch(inst1):', trySk.maxLevel, trySk.result)
  if (trySk.messages?.length) {
    console.log('[13] messages:', trySk.messages.map(m => m.message))
  }

  // Check: did anything get added to the instance or the template?
  const r = await api.v1.common.getAppVersion({})
  const instNode = r.structure.tree[inst1]
  console.log('[13] inst1 children:', instNode?.children)

  const tplChildren = r.structure.tree[tpl]?.children
  console.log('[13] tpl children count:', tplChildren?.length)

  return { asmId }
}
