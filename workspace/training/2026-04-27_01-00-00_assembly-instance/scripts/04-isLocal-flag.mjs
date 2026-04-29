export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'LocalAsm' })).result

  // Create sub-assembly template positioned at x=100
  const subTplId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create a part template for instancing
  const pegTplId = (await api.v1.assembly.partTemplate({ name: 'Peg' })).result
  await api.v1.part.cylinder({ id: pegTplId, name: 'C1', height: 40, diameter: 10 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the sub-assembly at x=100
  const subInst = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: asmId, name: 'Sub_at_100',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[04] sub-assembly instance:', subInst)

  // Add peg to sub-assembly with isLocal=false (global coords) at x=120
  const r1 = await api.v1.assembly.instance({
    productId: pegTplId, ownerId: subInst, name: 'GlobalPeg',
    transformation: [[120, 0, 0], [1, 0, 0], [0, 1, 0]],
    isLocal: false,
  })
  console.log('[04] global peg (isLocal=false, x=120):', r1.result, 'maxLevel:', r1.maxLevel)

  // Add peg to sub-assembly with isLocal=true (local coords) at x=20
  // local x=20 relative to sub at x=100 → global x=120
  const r2 = await api.v1.assembly.instance({
    productId: pegTplId, ownerId: subInst, name: 'LocalPeg',
    transformation: [[20, 0, 0], [1, 0, 0], [0, 1, 0]],
    isLocal: true,
  })
  console.log('[04] local peg (isLocal=true, x=20):', r2.result, 'maxLevel:', r2.maxLevel)

  // Add peg with isLocal=true at origin → should appear at sub's position (x=100)
  const r3 = await api.v1.assembly.instance({
    productId: pegTplId, ownerId: subInst, name: 'LocalOriginPeg',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
    isLocal: true,
  })
  console.log('[04] local origin peg (isLocal=true, x=0):', r3.result, 'maxLevel:', r3.maxLevel)

  // Default isLocal=false — peg at x=50 (global)
  const r4 = await api.v1.assembly.instance({
    productId: pegTplId, ownerId: subInst, name: 'DefaultPeg',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[04] default (isLocal=false implied), x=50:', r4.result, 'maxLevel:', r4.maxLevel)

  await snapshot('isLocal-test')

  // Dump structure to verify positions
  const struct = (await api.v1.assembly.instance({ productId: pegTplId, ownerId: asmId, name: 'probe' }))
  // Actually let's just get mass props to verify positions
  const m1 = (await api.v1.assembly.calculateMassProperties({ id: r1.result })).result
  const m2 = (await api.v1.assembly.calculateMassProperties({ id: r2.result })).result
  const m3 = (await api.v1.assembly.calculateMassProperties({ id: r3.result })).result
  const m4 = (await api.v1.assembly.calculateMassProperties({ id: r4.result })).result
  console.log('[04] COG global peg:', m1.cog)
  console.log('[04] COG local peg:', m2.cog)
  console.log('[04] COG local origin peg:', m3.cog)
  console.log('[04] COG default peg:', m4.cog)

  filewrite({ globalPeg: m1.cog, localPeg: m2.cog, localOriginPeg: m3.cog, defaultPeg: m4.cog }, 'cog-positions')

  return { asmId }
}
