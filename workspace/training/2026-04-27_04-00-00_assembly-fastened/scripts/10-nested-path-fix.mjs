export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'NestedTest2' })).result

  const partTpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: partTpl, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsBlock = (await api.v1.part.workCSys({
    id: partTpl, name: 'WCS', origin: [15, 10, 15],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const subAsmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  const subInst1 = (await api.v1.assembly.instance({
    productId: partTpl, ownerId: subAsmTpl, name: 'Left',
  })).result
  const subInst2 = (await api.v1.assembly.instance({
    productId: partTpl, ownerId: subAsmTpl, name: 'Right',
    transformation: [[40, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const connTpl = (await api.v1.assembly.partTemplate({ name: 'Connector' })).result
  await api.v1.part.cylinder({ id: connTpl, name: 'Cyl', height: 40, diameter: 10 })
  const wcsConn = (await api.v1.part.workCSys({
    id: connTpl, name: 'WCS', origin: [0, 0, 20],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const subAsmInst = (await api.v1.assembly.instance({
    productId: subAsmTpl, ownerId: asmId, name: 'SubAsmInst',
  })).result

  const connInst = (await api.v1.assembly.instance({
    productId: connTpl, ownerId: asmId, name: 'ConnInst',
  })).result

  // Get ET children — getInstance returns array of IDs
  const etChildren = (await api.v1.assembly.getInstance({ ownerId: subAsmInst })).result
  console.log('[10] ET children:', etChildren)
  const etChild1 = etChildren[0]
  const etChild2 = etChildren[1]

  // Test 1: Nested path [subAsmInst, etChild]
  const r1 = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_Nested',
    mate1: { path: [subAsmInst, etChild1], csys: wcsBlock },
    mate2: { path: [connInst], csys: wcsConn },
    zOffset: 20,
  })
  console.log('[10] nested path [parent, child]:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'nested-response')

  // Test 2: Single-element path with ET child directly
  const r2 = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_ETDirect',
    mate1: { path: [etChild2], csys: wcsBlock },
    mate2: { path: [connInst], csys: wcsConn },
    xOffset: 50,
  })
  console.log('[10] ET direct [child]:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'et-direct-response')

  // Test 3: Just subAsmInst in path (no child)
  const connInst2 = (await api.v1.assembly.instance({
    productId: connTpl, ownerId: asmId, name: 'ConnInst2',
  })).result
  const r3 = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_SubAsmOnly',
    mate1: { path: [subAsmInst], csys: wcsBlock },
    mate2: { path: [connInst2], csys: wcsConn },
    yOffset: 30,
  })
  console.log('[10] sub-asm path [parent only]:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'subasm-only-response')

  await snapshot('nested')

  return { asmId }
}
