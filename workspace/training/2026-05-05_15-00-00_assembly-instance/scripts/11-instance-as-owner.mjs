export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: small box
  const tplA = (await api.v1.assembly.partTemplate({ name: 'SmallBox' })).result
  await api.v1.part.box({ id: tplA, name: 'B', length: 20, width: 15, height: 10 })
  // COG: [10, 7.5, 5]

  // Template B: sub-assembly
  const tplB = (await api.v1.assembly.assemblyTemplate({ name: 'Arm' })).result
  // Add an instance of A inside the sub-assembly template
  const innerInst = (await api.v1.assembly.instance({
    productId: tplA, ownerId: tplB, name: 'Inner',
    transformation: [[30, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[11] inner inst in tplB:', innerInst)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance of sub-assembly B at root
  const armInst = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'ArmInst',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[11] armInst:', armInst)

  // Now add another instance of A as a child of armInst (instance as owner)
  const childInst = (await api.v1.assembly.instance({
    productId: tplA, ownerId: armInst, name: 'ChildOfInst',
    transformation: [[0, 40, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[11] childInst:', childInst, '(child of armInst)')

  await snapshot('instance-as-owner')

  // Verify: the docs say "If the owner is an instance in the expanded tree,
  // its template in the assembly container will also be updated"
  // So: tplB should now contain TWO instances (Inner + ChildOfInst)
  const tplBInstances = await api.v1.assembly.getInstance({ ownerId: tplB })
  console.log('[11] tplB instances after child added via inst:', JSON.stringify(tplBInstances.result))

  // Mass verification
  const rootMass = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[11] root mass:', JSON.stringify(rootMass.result))
  filewrite(rootMass.result, 'root-mass')

  // armInst at [50,0,0] contains:
  //   Inner at local [30,0,0] → global [50+30+10, 0+0+7.5, 0+0+5] = [90, 7.5, 5]
  //   ChildOfInst at [0,40,0] — but is this global or local?
  //   Since added via instance owner, the transform should be in the GLOBAL frame by default
  //   So ChildOfInst global: [0+10, 40+7.5, 0+5] = [10, 47.5, 5]
  // Combined: [(90+10)/2, (7.5+47.5)/2, (5+5)/2] = [50, 27.5, 5]
  console.log('[11] predicted COG if child transform is global: [50, 27.5, 5]')
  // But if child transform is local to armInst:
  //   ChildOfInst at local [0,40,0] relative to armInst at [50,0,0]
  //   global: [50+0+10, 0+40+7.5, 0+0+5] = [60, 47.5, 5]
  //   Combined: [(90+60)/2, (7.5+47.5)/2, (5+5)/2] = [75, 27.5, 5]
  console.log('[11] predicted COG if child transform is local to owner: [75, 27.5, 5]')

  return { armInst, childInst }
}
