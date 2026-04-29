export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GetInstanceTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Bolt' })).result
  await api.v1.part.cylinder({ id: tpl1, name: 'BoltBody', height: 30, diameter: 8 })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Nut' })).result
  await api.v1.part.box({ id: tpl2, name: 'NutBody', length: 12, width: 12, height: 6 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create multiple instances with explicit names
  const b1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Bolt_1' })).result
  const b2 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Bolt_2',
    transformation: [[30, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const n1 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Nut_1',
    transformation: [[0, 0, 30], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[03] instances created — b1:', b1, 'b2:', b2, 'n1:', n1)

  // Test getInstance: find by name
  const found1 = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Bolt_1' })
  console.log('[03] getInstance(Bolt_1):', JSON.stringify({ result: found1.result, maxLevel: found1.maxLevel }))

  // Test getInstance: list all instances of an owner
  const allInsts = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[03] getInstance(all):', JSON.stringify({ result: allInsts.result, maxLevel: allInsts.maxLevel }))

  // Test getInstance: not found
  const notFound = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'NonExistent' })
  console.log('[03] getInstance(NonExistent):', JSON.stringify({ result: notFound.result, maxLevel: notFound.maxLevel, messages: notFound.messages }))

  // Test getInstance: find by name that has multiple matches? (unlikely, names are unique per owner)
  const b2found = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Bolt_2' })
  console.log('[03] getInstance(Bolt_2):', JSON.stringify({ result: b2found.result, maxLevel: b2found.maxLevel }))

  // Can we use getInstance on a template ID?
  const fromTpl = await api.v1.assembly.getInstance({ ownerId: tpl1 })
  console.log('[03] getInstance(ownerId=tpl1):', JSON.stringify({ result: fromTpl.result, maxLevel: fromTpl.maxLevel, messages: fromTpl.messages }))

  await snapshot('instances')
  return { asmId, tpl1, tpl2, b1, b2, n1 }
}
