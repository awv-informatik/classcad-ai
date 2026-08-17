export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'NestedTest' })).result

  // Create two part templates
  const gearTpl = (await api.v1.assembly.partTemplate({ name: 'Gear' })).result
  await api.v1.part.cylinder({ id: gearTpl, name: 'GearBody', height: 10, diameter: 40 })
  const gearWcs = (await api.v1.part.workCSys({
    id: gearTpl, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const shaftTpl = (await api.v1.assembly.partTemplate({ name: 'Shaft' })).result
  await api.v1.part.cylinder({ id: shaftTpl, name: 'ShaftBody', height: 60, diameter: 8 })
  const shaftWcs = (await api.v1.part.workCSys({
    id: shaftTpl, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Create assembly template (sub-assembly)
  const gearboxTpl = (await api.v1.assembly.assemblyTemplate({ name: 'Gearbox' })).result
  console.log('[04] gearTpl:', gearTpl, 'shaftTpl:', shaftTpl, 'gearboxTpl:', gearboxTpl)

  // Switch to gearbox and add instances
  await api.v1.assembly.setCurrentProduct({ id: gearboxTpl })
  const shaftInst = (await api.v1.assembly.instance({ productId: shaftTpl, ownerId: gearboxTpl, name: 'MainShaft' })).result
  const gear1Inst = (await api.v1.assembly.instance({ productId: gearTpl, ownerId: gearboxTpl, name: 'Gear1',
    transformation: [[0, 0, 10], [1, 0, 0], [0, 1, 0]],
  })).result
  const gear2Inst = (await api.v1.assembly.instance({ productId: gearTpl, ownerId: gearboxTpl, name: 'Gear2',
    transformation: [[0, 0, 30], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[04] gearbox instances — shaft:', shaftInst, 'gear1:', gear1Inst, 'gear2:', gear2Inst)

  // Switch back to root and create instances of the gearbox
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const gbox1 = (await api.v1.assembly.instance({ productId: gearboxTpl, ownerId: asmId, name: 'Gearbox_1' })).result
  const gbox2 = (await api.v1.assembly.instance({ productId: gearboxTpl, ownerId: asmId, name: 'Gearbox_2',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[04] root instances — gbox1:', gbox1, 'gbox2:', gbox2)

  // Examine getInstance on the gearbox instance (should we see nested instances?)
  const gbox1Children = await api.v1.assembly.getInstance({ ownerId: gbox1 })
  console.log('[04] getInstance(gbox1 children):', JSON.stringify(gbox1Children.result))

  // Examine getInstance on the template
  const gboxTplChildren = await api.v1.assembly.getInstance({ ownerId: gearboxTpl })
  console.log('[04] getInstance(gearboxTpl children):', JSON.stringify(gboxTplChildren.result))

  // Dump structure
  const r = await api.v1.common.getAppVersion({})
  filewrite(r.structure, 'nested-structure')

  await snapshot('nested-assembly')
  return { asmId, gearboxTpl, gbox1, gbox2 }
}
