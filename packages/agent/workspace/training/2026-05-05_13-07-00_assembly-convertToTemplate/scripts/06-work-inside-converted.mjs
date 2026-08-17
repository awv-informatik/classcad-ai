export default async function (api, { snapshot, filewrite }) {
  // Create assembly with a box template
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result
  const boxTpl = (await api.v1.assembly.partTemplate({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: boxTpl, name: 'B1', length: 50, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the box
  const inst1 = (await api.v1.assembly.instance({
    productId: boxTpl,
    ownerId: asmId,
    name: 'BoxInst',
    transformation: [[10, 10, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Convert the root to a template
  await api.v1.assembly.convertToTemplate({ name: 'SubAsm' })
  const convertedId = (await api.v1.assembly.getAssemblyTemplate({ name: 'SubAsm' })).result
  const newRoot = (await api.v1.assembly.getAssemblyTemplate({ name: 'SubAsm' })).structure?.root
  console.log('[06] convertedId:', convertedId, 'newRoot (from structure):', newRoot)

  // Create a second part template (a cylinder)
  const cylTpl = (await api.v1.assembly.partTemplate({ name: 'CylPart' })).result
  await api.v1.part.cylinder({ id: cylTpl, name: 'C1', height: 40, diameter: 20 })

  // Switch into the converted template and add a cylinder instance
  await api.v1.assembly.setCurrentProduct({ id: convertedId })
  const cylInst = (await api.v1.assembly.instance({
    productId: cylTpl,
    ownerId: convertedId,
    name: 'CylInst',
    transformation: [[70, 10, 0], [1, 0, 0], [0, 1, 0]],
    isLocal: true,
  })).result
  console.log('[06] added cylinder instance inside converted template:', cylInst)

  // Return to new root context
  // Need to figure out the new root ID
  const r = await api.v1.assembly.setCurrentProduct({ id: convertedId })
  const rootFromStruct = r.structure?.root
  console.log('[06] root from structure:', rootFromStruct)
  await api.v1.assembly.setCurrentProduct({ id: rootFromStruct })

  // Instance the (now modified) converted template
  const subInst = (await api.v1.assembly.instance({
    productId: convertedId,
    ownerId: rootFromStruct,
    name: 'SubAsmInst',
  })).result

  // Measure COG — should include both box and cylinder
  const cog = (await api.v1.assembly.calculateMassProperties({ id: subInst })).result
  console.log('[06] sub-assembly instance COG (with cyl):', JSON.stringify(cog))

  // For comparison, measure just the box template COG in the same context
  const boxCog = (await api.v1.assembly.calculateMassProperties({ id: boxTpl })).result
  console.log('[06] box template COG:', JSON.stringify(boxCog))

  await snapshot('modified-converted')

  filewrite({
    convertedId,
    rootFromStruct,
    cylInst,
    subInst,
    subAsmCog: cog,
    boxTemplateCog: boxCog,
  }, 'work-inside')

  return { convertedId, subInst }
}
