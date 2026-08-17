export default async function (api, { snapshot, filewrite }) {
  // Create root assembly
  const asmId = (await api.v1.assembly.create({ name: 'RootAsm' })).result
  console.log('[02] root assembly:', asmId)

  // Create an assembly template (sub-assembly)
  const subAsmId = (await api.v1.assembly.assemblyTemplate({ name: 'Bracket' })).result
  console.log('[02] sub-assembly template:', subAsmId)

  // Now we need to build geometry INSIDE the sub-assembly.
  // An assembly template needs part templates inside it, then instances of those.
  // But first: can we create a part template inside the sub-assembly context?
  // Let's try: setCurrentProduct to the sub-assembly, then partTemplate
  const cpBefore = (await api.v1.assembly.setCurrentProduct({ id: subAsmId })).result
  console.log('[02] setCurrentProduct to subAsm, prev currentProduct:', cpBefore)

  // Create a part template — will this live inside the sub-assembly?
  const plateTpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  console.log('[02] partTemplate inside subAsm context:', plateTpl)

  // Build geometry in the plate template
  await api.v1.part.box({ id: plateTpl, name: 'PlateBody', length: 60, width: 40, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: plateTpl, name: 'MateCSys',
    origin: [30, 20, 10], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[02] plate box + wcs created, wcs:', wcs1)

  // Return to sub-assembly context
  await api.v1.assembly.setCurrentProduct({ id: subAsmId })

  // Instantiate the plate inside the sub-assembly
  const plateInst = (await api.v1.assembly.instance({
    productId: plateTpl,
    ownerId: subAsmId,
    name: 'PlateInst',
  })).result
  console.log('[02] instance inside subAsm:', plateInst)

  // Now return to root assembly and instantiate the sub-assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const subAsmInst = (await api.v1.assembly.instance({
    productId: subAsmId,
    ownerId: asmId,
    name: 'BracketInst1',
  })).result
  console.log('[02] sub-assembly instance in root:', subAsmInst)

  // Create a second instance offset in X
  const subAsmInst2 = (await api.v1.assembly.instance({
    productId: subAsmId,
    ownerId: asmId,
    name: 'BracketInst2',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[02] second sub-assembly instance:', subAsmInst2)

  await snapshot('sub-assembly-instances')

  // Verify spatial positioning with COG
  const cog1 = (await api.v1.assembly.calculateMassProperties({ id: subAsmInst })).result
  const cog2 = (await api.v1.assembly.calculateMassProperties({ id: subAsmInst2 })).result
  console.log('[02] COG inst1:', JSON.stringify(cog1))
  console.log('[02] COG inst2:', JSON.stringify(cog2))

  filewrite({ cog1, cog2, subAsmInst, subAsmInst2 }, 'cog-comparison')

  // Dump structure to see how nested assembly looks
  const structR = await api.v1.assembly.setCurrentProduct({ id: asmId })
  filewrite(structR.structure, 'final-structure')

  return { asmId, subAsmId, plateTpl, plateInst, subAsmInst, subAsmInst2 }
}
