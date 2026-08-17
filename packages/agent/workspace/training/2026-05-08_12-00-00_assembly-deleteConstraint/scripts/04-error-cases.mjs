export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcs },
  })).result

  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'Joint',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 80,
  })).result

  // Test 1: Non-existent ID
  const r1 = await api.v1.assembly.deleteConstraint({ ids: [99999] })
  console.log('[04] non-existent ID - result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ test: 'non-existent-id', result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'test1-nonexistent')

  // Test 2: Instance ID (not a constraint)
  const r2 = await api.v1.assembly.deleteConstraint({ ids: [inst1] })
  console.log('[04] instance ID - result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ test: 'instance-id', result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'test2-instance-id')

  // Test 3: Assembly root ID
  const r3 = await api.v1.assembly.deleteConstraint({ ids: [asmId] })
  console.log('[04] assembly root ID - result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ test: 'assembly-root-id', result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'test3-assembly-id')

  // Test 4: Template ID
  const r4 = await api.v1.assembly.deleteConstraint({ ids: [tpl] })
  console.log('[04] template ID - result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ test: 'template-id', result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'test4-template-id')

  // Test 5: Empty array
  const r5 = await api.v1.assembly.deleteConstraint({ ids: [] })
  console.log('[04] empty array - result:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ test: 'empty-array', result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'test5-empty')

  // Test 6: Delete a valid constraint, then try deleting it again (double delete)
  const del1 = await api.v1.assembly.deleteConstraint({ ids: [fId] })
  console.log('[04] first delete - result:', del1.result, 'maxLevel:', del1.maxLevel)
  const del2 = await api.v1.assembly.deleteConstraint({ ids: [fId] })
  console.log('[04] double delete - result:', del2.result, 'maxLevel:', del2.maxLevel)
  filewrite({ test: 'double-delete', result: del2.result, messages: del2.messages, maxLevel: del2.maxLevel }, 'test6-double-delete')

  // Test 7: Mixed valid + invalid IDs in one call
  const r7 = await api.v1.assembly.deleteConstraint({ ids: [foId, 99999] })
  console.log('[04] mixed valid+invalid - result:', r7.result, 'maxLevel:', r7.maxLevel)
  filewrite({ test: 'mixed-valid-invalid', result: r7.result, messages: r7.messages, maxLevel: r7.maxLevel }, 'test7-mixed')

  // Check if the valid one (foId) was deleted despite the invalid one
  const getFo = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'Ground' })
  console.log('[04] getFastenedOrigin after mixed delete:', getFo.result ? 'exists' : 'null', 'maxLevel:', getFo.maxLevel)

  return { asmId }
}
