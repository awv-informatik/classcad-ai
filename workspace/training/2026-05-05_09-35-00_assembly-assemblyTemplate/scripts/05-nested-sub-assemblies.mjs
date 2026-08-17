export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create a part template with a box
  const plateTpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: plateTpl, name: 'Body', length: 40, width: 30, height: 10 })

  // Create inner sub-assembly template
  const innerSubAsm = (await api.v1.assembly.assemblyTemplate({ name: 'InnerSub' })).result
  console.log('[05] inner sub-assembly:', innerSubAsm)

  // Instance the plate inside the inner sub-assembly
  await api.v1.assembly.setCurrentProduct({ id: innerSubAsm })
  const plateInInner = (await api.v1.assembly.instance({
    productId: plateTpl,
    ownerId: innerSubAsm,
    name: 'PlateInInner',
  })).result
  console.log('[05] plate instance in inner sub:', plateInInner)

  // Create outer sub-assembly template
  const outerSubAsm = (await api.v1.assembly.assemblyTemplate({ name: 'OuterSub' })).result
  console.log('[05] outer sub-assembly:', outerSubAsm)

  // Instance the inner sub-assembly inside the outer sub-assembly
  await api.v1.assembly.setCurrentProduct({ id: outerSubAsm })
  const innerInOuter = (await api.v1.assembly.instance({
    productId: innerSubAsm,
    ownerId: outerSubAsm,
    name: 'InnerInOuter',
    transformation: [[20, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[05] inner sub-assembly instance in outer:', innerInOuter)

  // Return to root and instantiate outer sub-assembly at two positions
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const outerInst1 = (await api.v1.assembly.instance({
    productId: outerSubAsm,
    ownerId: asmId,
    name: 'OuterInst1',
  })).result

  const outerInst2 = (await api.v1.assembly.instance({
    productId: outerSubAsm,
    ownerId: asmId,
    name: 'OuterInst2',
    transformation: [[0, 80, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[05] outer instances in root:', outerInst1, outerInst2)

  await snapshot('nested-sub-assemblies')

  // Verify COG at each level
  const cogOuter1 = (await api.v1.assembly.calculateMassProperties({ id: outerInst1 })).result
  const cogOuter2 = (await api.v1.assembly.calculateMassProperties({ id: outerInst2 })).result
  console.log('[05] COG outerInst1:', JSON.stringify(cogOuter1))
  console.log('[05] COG outerInst2:', JSON.stringify(cogOuter2))

  // Expected: plate is 40x30x10 with COG at (20,15,5) local.
  // InnerSub has plate at origin → innerSub COG = (20,15,5)
  // OuterSub has innerSub offset at (20,0,0) → outerSub COG = (20+20,15,5) = (40,15,5)
  // OuterInst1 at origin → COG = (40,15,5)
  // OuterInst2 at (0,80,0) → COG = (40, 95, 5)

  filewrite({ cogOuter1, cogOuter2, expected: {
    outerInst1: { x: 40, y: 15, z: 5 },
    outerInst2: { x: 40, y: 95, z: 5 },
  }}, 'nested-cog')

  return { outerInst1, outerInst2 }
}
