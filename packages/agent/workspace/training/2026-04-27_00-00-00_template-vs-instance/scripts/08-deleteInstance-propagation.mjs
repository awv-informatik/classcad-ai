export default async function (api, { snapshot, filewrite }) {
  // Test: does deleteInstance from an assembly instance propagate to template and other instances?
  const asmId = (await api.v1.assembly.create({ name: 'DeleteTest' })).result

  const partTpl = (await api.v1.assembly.partTemplate({ name: 'Widget' })).result
  await api.v1.part.box({ id: partTpl, name: 'Box', length: 20, width: 20, height: 20 })

  const subTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  await api.v1.assembly.setCurrentProduct({ id: subTpl })
  const w1 = (await api.v1.assembly.instance({ productId: partTpl, ownerId: subTpl, name: 'W1' })).result
  const w2 = (await api.v1.assembly.instance({ productId: partTpl, ownerId: subTpl, name: 'W2',
    transformation: [[30, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const w3 = (await api.v1.assembly.instance({ productId: partTpl, ownerId: subTpl, name: 'W3',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const s1 = (await api.v1.assembly.instance({ productId: subTpl, ownerId: asmId, name: 'Sub1' })).result
  const s2 = (await api.v1.assembly.instance({ productId: subTpl, ownerId: asmId, name: 'Sub2',
    transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Check initial state
  const s1kids = (await api.v1.assembly.getInstance({ ownerId: s1 })).result
  const s2kids = (await api.v1.assembly.getInstance({ ownerId: s2 })).result
  const tplkids = (await api.v1.assembly.getInstance({ ownerId: subTpl })).result
  console.log('[08] BEFORE — s1:', s1kids, 's2:', s2kids, 'tpl:', tplkids)

  // Delete W2's expanded instance from s1
  // The second child of s1 should be the W2 equivalent
  console.log('[08] deleting s1 child[1]:', s1kids[1])
  const delResult = await api.v1.assembly.deleteInstance({ ids: [s1kids[1]] })
  console.log('[08] deleteInstance result:', delResult.maxLevel, delResult.messages?.map(m => m.message))

  // Check after deletion
  const s1kidsAfter = (await api.v1.assembly.getInstance({ ownerId: s1 })).result
  const s2kidsAfter = (await api.v1.assembly.getInstance({ ownerId: s2 })).result
  const tplkidsAfter = (await api.v1.assembly.getInstance({ ownerId: subTpl })).result
  console.log('[08] AFTER — s1:', s1kidsAfter, 's2:', s2kidsAfter, 'tpl:', tplkidsAfter)

  // Compare: did the deletion propagate to s2 and the template?
  console.log('[08] s1 count: 3 →', s1kidsAfter.length)
  console.log('[08] s2 count: 3 →', s2kidsAfter.length)
  console.log('[08] tpl count: 3 →', tplkidsAfter.length)

  return { asmId }
}
