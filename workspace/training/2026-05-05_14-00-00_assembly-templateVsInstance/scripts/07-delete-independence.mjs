export default async function (api, { snapshot, filewrite }) {
  // Test: deleting instance doesn't affect template, deleting template cascades to instances
  const asmId = (await api.v1.assembly.create({ name: 'DelTest' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })

  const tpl2Id = (await api.v1.assembly.partTemplate({ name: 'Bolt' })).result
  await api.v1.part.cylinder({ id: tpl2Id, name: 'Shaft', height: 30, diameter: 8 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Plate1'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Plate2',
    transformation: [[70, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl2Id, ownerId: asmId, name: 'Bolt1',
    transformation: [[30, 20, 10], [1, 0, 0], [0, 1, 0]]
  })).result

  console.log('[07] instances:', inst1, inst2, inst3)

  // Check instances before delete
  const before = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[07] BEFORE delete — instances:', JSON.stringify(before.result))

  // Delete one instance — should NOT affect template
  const delR = await api.v1.assembly.deleteInstance({ ids: [inst1] })
  console.log('[07] deleteInstance(inst1) maxLevel:', delR.maxLevel)

  // Verify template still exists
  const tplCheck = await api.v1.assembly.getPartTemplate({ name: 'Plate' })
  console.log('[07] template after instance delete:', tplCheck.result)

  // Remaining instances
  const after1 = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[07] AFTER inst1 delete — instances:', JSON.stringify(after1.result))

  // Now delete template — should cascade to remaining instances of that template
  const delTplR = await api.v1.assembly.deleteTemplate({ ids: [tplId] })
  console.log('[07] deleteTemplate(Plate) maxLevel:', delTplR.maxLevel)

  // Check what instances remain (only Bolt1 should survive)
  const after2 = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[07] AFTER template delete — instances:', JSON.stringify(after2.result))

  // Verify template is gone
  const tplCheck2 = await api.v1.assembly.getPartTemplate({ name: 'Plate' })
  console.log('[07] getPartTemplate(Plate) after delete:', tplCheck2.result, 'maxLevel:', tplCheck2.maxLevel)

  filewrite({
    before: before.result,
    afterInstanceDelete: after1.result,
    afterTemplateDelete: after2.result,
    templateGone: { result: tplCheck2.result, maxLevel: tplCheck2.maxLevel }
  }, 'delete-independence')

  await snapshot('after-deletes')
  return { asmId }
}
