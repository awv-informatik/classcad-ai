export default async function (api, { snapshot, filewrite }) {
  // Test calculateMassProperties on template ID vs instance ID
  const asmId = (await api.v1.assembly.create({ name: 'MassTest' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'Body', length: 60, width: 40, height: 10 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instances at different positions
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'AtOrigin'
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Offset100X',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  // Now test calculateMassProperties on each
  const massTemplate = await api.v1.assembly.calculateMassProperties({ id: tplId })
  console.log('[02] template mass maxLevel:', massTemplate.maxLevel)
  console.log('[02] template COG:', JSON.stringify(massTemplate.result?.cog))
  console.log('[02] template volume:', massTemplate.result?.volume)

  const massInst1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[02] inst1 mass maxLevel:', massInst1.maxLevel)
  console.log('[02] inst1 COG:', JSON.stringify(massInst1.result?.cog))
  console.log('[02] inst1 volume:', massInst1.result?.volume)

  const massInst2 = await api.v1.assembly.calculateMassProperties({ id: inst2 })
  console.log('[02] inst2 mass maxLevel:', massInst2.maxLevel)
  console.log('[02] inst2 COG:', JSON.stringify(massInst2.result?.cog))
  console.log('[02] inst2 volume:', massInst2.result?.volume)

  // Also test on the root assembly (all instances combined)
  const massRoot = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[02] root mass maxLevel:', massRoot.maxLevel)
  console.log('[02] root COG:', JSON.stringify(massRoot.result?.cog))
  console.log('[02] root volume:', massRoot.result?.volume)

  filewrite({
    template: massTemplate.result,
    instance1: massInst1.result,
    instance2: massInst2.result,
    rootAssembly: massRoot.result
  }, 'mass-comparison')

  await snapshot('two-offset-instances')
  return { asmId, tplId, inst1, inst2 }
}
