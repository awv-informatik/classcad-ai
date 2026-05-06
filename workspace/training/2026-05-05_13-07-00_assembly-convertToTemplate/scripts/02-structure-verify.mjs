export default async function (api, { snapshot, filewrite }) {
  // Create assembly with content
  const asmId = (await api.v1.assembly.create({ name: 'OriginalRoot' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'CylPart' })).result
  await api.v1.part.cylinder({ id: tplId, name: 'Cyl1', height: 50, diameter: 30 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create two instances at different positions
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId,
    ownerId: asmId,
    name: 'CylInst1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId,
    ownerId: asmId,
    name: 'CylInst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Structure dump before
  const structBefore = {
    root: asmId,
    instances: [inst1, inst2],
    partTemplate: tplId,
  }
  console.log('[02] before convert:', JSON.stringify(structBefore))

  // Measure individual instance COGs
  const cog1Before = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  const cog2Before = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[02] inst1 COG before:', JSON.stringify(cog1Before?.cog))
  console.log('[02] inst2 COG before:', JSON.stringify(cog2Before?.cog))

  // Convert with default name (no params)
  const r1 = await api.v1.assembly.convertToTemplate()
  const newRoot1 = r1.structure?.root
  console.log('[02] convert (default name) → newRoot:', newRoot1, 'result:', r1.result, 'maxLevel:', r1.maxLevel)

  // The old assembly (12) should now be retrievable as "Subassembly" (the default name)
  const defaultTpl = (await api.v1.assembly.getAssemblyTemplate({ name: 'Subassembly' })).result
  console.log('[02] getAssemblyTemplate("Subassembly"):', defaultTpl)

  // The part template should still be accessible
  const partTpl = (await api.v1.assembly.getPartTemplate({ name: 'CylPart' })).result
  console.log('[02] getPartTemplate("CylPart") after convert:', partTpl)

  // Now do a SECOND conversion with a custom name to test naming
  // First, let's instance the converted template so the new root has content
  const subInst = (await api.v1.assembly.instance({
    productId: defaultTpl,
    ownerId: newRoot1,
    name: 'SubAsmInst',
  })).result

  const r2 = await api.v1.assembly.convertToTemplate({ name: 'MyTopLevel' })
  const newRoot2 = r2.structure?.root
  console.log('[02] convert (custom name "MyTopLevel") → newRoot:', newRoot2)

  const customTpl = (await api.v1.assembly.getAssemblyTemplate({ name: 'MyTopLevel' })).result
  console.log('[02] getAssemblyTemplate("MyTopLevel"):', customTpl)

  // Verify both assembly templates exist
  const allAsmTpls = (await api.v1.assembly.getAssemblyTemplate({})).result
  console.log('[02] all assembly templates:', JSON.stringify(allAsmTpls))

  // Instance the top-level and check final COG
  const topInst = (await api.v1.assembly.instance({
    productId: customTpl,
    ownerId: newRoot2,
    name: 'TopInst',
  })).result

  const finalCog = (await api.v1.assembly.calculateMassProperties({ id: newRoot2 })).result
  console.log('[02] final root COG:', JSON.stringify(finalCog?.cog))

  await snapshot('final-structure')

  filewrite({
    structBefore,
    cog1Before: cog1Before?.cog,
    cog2Before: cog2Before?.cog,
    firstConvert: { defaultTpl, newRoot: newRoot1 },
    secondConvert: { customTpl, newRoot: newRoot2 },
    allAsmTpls,
    partTplAfter: partTpl,
    finalCog: finalCog?.cog,
  }, 'structure-data')

  return { asmId, tplId, newRoot1, newRoot2 }
}
