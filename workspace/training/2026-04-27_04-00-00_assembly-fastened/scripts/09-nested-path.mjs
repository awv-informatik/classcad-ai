export default async function (api, { snapshot, filewrite }) {
  // Build: root assembly → sub-assembly template with two parts → instances in root
  const asmId = (await api.v1.assembly.create({ name: 'NestedTest' })).result

  // Part template for a simple block
  const partTpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: partTpl, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsBlock = (await api.v1.part.workCSys({
    id: partTpl, name: 'WCS', origin: [15, 10, 15],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Sub-assembly template containing two block instances
  const subAsmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  // Sub-assembly is now current product — add instances to it
  const subInst1 = (await api.v1.assembly.instance({
    productId: partTpl, ownerId: subAsmTpl, name: 'Left',
  })).result
  const subInst2 = (await api.v1.assembly.instance({
    productId: partTpl, ownerId: subAsmTpl, name: 'Right',
    transformation: [[40, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[09] sub instances:', subInst1, subInst2)

  // Another standalone part template
  const connTpl = (await api.v1.assembly.partTemplate({ name: 'Connector' })).result
  await api.v1.part.cylinder({ id: connTpl, name: 'Cyl', height: 40, diameter: 10 })
  const wcsConn = (await api.v1.part.workCSys({
    id: connTpl, name: 'WCS', origin: [0, 0, 20],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Back to root assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the sub-assembly
  const subAsmInst = (await api.v1.assembly.instance({
    productId: subAsmTpl, ownerId: asmId, name: 'SubAsmInst',
  })).result
  console.log('[09] subAsmInst:', subAsmInst)

  // Instance the connector
  const connInst = (await api.v1.assembly.instance({
    productId: connTpl, ownerId: asmId, name: 'ConnInst',
  })).result

  // Get expanded tree instances (the sub-assembly's children in the root)
  const getInst = await api.v1.assembly.getInstance({ ownerId: subAsmInst })
  console.log('[09] expanded tree children:', JSON.stringify(getInst.result))
  filewrite(getInst.result, 'expanded-tree')

  // Try fastened constraint with nested path: [subAsmInst, expandedTreeChild]
  // The expanded tree children should be CC_ProductReferenceET nodes
  if (getInst.result && getInst.result.length > 0) {
    const etChild1 = getInst.result[0].id
    const etChild2 = getInst.result.length > 1 ? getInst.result[1].id : null

    // Constrain connector to a sub-assembly child using nested path
    const r1 = await api.v1.assembly.fastened({
      id: asmId,
      name: 'F_Nested',
      mate1: { path: [subAsmInst, etChild1], csys: wcsBlock },
      mate2: { path: [connInst], csys: wcsConn },
      zOffset: 20,
    })
    console.log('[09] nested path result:', r1.result, 'maxLevel:', r1.maxLevel)
    filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'nested-response')

    // Also try single-element path with ET child directly
    if (etChild2) {
      const r2 = await api.v1.assembly.fastened({
        id: asmId,
        name: 'F_ETDirect',
        mate1: { path: [etChild2], csys: wcsBlock },
        mate2: { path: [connInst], csys: wcsConn },
        xOffset: 50,
      })
      console.log('[09] ET direct path:', r2.result, 'maxLevel:', r2.maxLevel)
      filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'et-direct-response')
    }
  }

  await snapshot('nested')

  return { asmId }
}
