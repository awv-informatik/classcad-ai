export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Part template with a box
  const tplId = (await api.v1.assembly.partTemplate({})).result
  const boxFeatId = (await api.v1.part.box({ id: tplId, name: 'Box', length: 40, width: 30, height: 20 })).result
  const wcsId = (await api.v1.part.workCSys({ id: tplId, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Sub-assembly template
  const subAsmTpl = (await api.v1.assembly.assemblyTemplate({})).result
  const subInst = (await api.v1.assembly.instance({ productId: tplId, ownerId: subAsmTpl, name: 'SubBox' })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instances
  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result
  const subAsmInst = (await api.v1.assembly.instance({
    productId: subAsmTpl, ownerId: asmId, name: 'SubAsm1',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Test all ID types with assembly.calculateMassProperties
  const tests = [
    { label: 'asmRoot', id: asmId },
    { label: 'partTemplate', id: tplId },
    { label: 'asmTemplate', id: subAsmTpl },
    { label: 'partInstance', id: inst1 },
    { label: 'subAsmInstance', id: subAsmInst },
    { label: 'boxFeature', id: boxFeatId },
    { label: 'workCSys', id: wcsId },
    { label: 'subInstInside', id: subInst },
  ]

  const results = {}
  for (const t of tests) {
    try {
      const r = await api.v1.assembly.calculateMassProperties({ id: t.id })
      results[t.label] = { result: r.result, maxLevel: r.maxLevel, messages: r.messages?.slice(0, 2) }
      console.log(`[05] ${t.label} (id=${t.id}): result=${JSON.stringify(r.result)}, maxLevel=${r.maxLevel}`)
    } catch (e) {
      results[t.label] = { error: e.message }
      console.log(`[05] ${t.label} (id=${t.id}): ERROR ${e.message}`)
    }
  }

  // Also test part.calculateMassProperties for comparison
  const partTests = [
    { label: 'part.asmRoot', id: asmId },
    { label: 'part.partTemplate', id: tplId },
    { label: 'part.asmTemplate', id: subAsmTpl },
    { label: 'part.partInstance', id: inst1 },
    { label: 'part.subAsmInstance', id: subAsmInst },
  ]

  for (const t of partTests) {
    try {
      const r = await api.v1.part.calculateMassProperties({ id: t.id })
      results[t.label] = { result: r.result, maxLevel: r.maxLevel, messages: r.messages?.slice(0, 2) }
      console.log(`[05] ${t.label} (id=${t.id}): result=${JSON.stringify(r.result)}, maxLevel=${r.maxLevel}`)
    } catch (e) {
      results[t.label] = { error: e.message }
      console.log(`[05] ${t.label} (id=${t.id}): ERROR ${e.message}`)
    }
  }

  filewrite(results, 'id-types')
  await snapshot('id-types')
  return { asmId }
}
