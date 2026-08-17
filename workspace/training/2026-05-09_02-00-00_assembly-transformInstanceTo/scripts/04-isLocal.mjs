export default async function (api, { snapshot, filewrite }) {
  // Setup: root assembly with a sub-assembly rotated 90° around Z
  const rootId = (await api.v1.assembly.create({})).result

  // Sub-assembly template with a block
  const subTplId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  const partTplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: partTplId, name: 'B1', length: 40, width: 20, height: 10 })
  await api.v1.assembly.setCurrentProduct({ id: subTplId })

  // Child instance inside sub-assembly at [20, 0, 0]
  const childInst = (await api.v1.assembly.instance({
    productId: partTplId, ownerId: subTplId, name: 'Child',
    transformation: [[20, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Reference sphere at origin of sub-assembly
  const refTplId = (await api.v1.assembly.partTemplate({ name: 'Ref' })).result
  await api.v1.part.sphere({ id: refTplId, name: 'S1', radius: 5 })
  await api.v1.assembly.setCurrentProduct({ id: subTplId })
  await api.v1.assembly.instance({ productId: refTplId, ownerId: subTplId, name: 'RefSphere' })

  // Instantiate sub-assembly in root, rotated 90° around Z
  // 90°Z: xDir=[0,1,0], yDir=[-1,0,0]
  await api.v1.assembly.setCurrentProduct({ id: rootId })
  const subInst = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: rootId, name: 'SubInst',
    transformation: [[0, 0, 0], [0, 1, 0], [-1, 0, 0]],
  })).result

  console.log('[04] rootId:', rootId, 'subInst:', subInst, 'childInst:', childInst)

  // Find child ET instance
  const childETs = (await api.v1.assembly.getInstance({ ownerId: subInst })).result
  console.log('[04] child ETs under subInst:', JSON.stringify(childETs))

  // Pick the block child ET (not the sphere)
  // We'll use them all for testing but need to identify the block
  const childET = Array.isArray(childETs) ? childETs[0] : childETs

  await snapshot('before')
  const cog0 = (await api.v1.assembly.calculateMassProperties({ id: rootId })).result
  console.log('[04] initial COG:', JSON.stringify(cog0?.cog))

  // transformInstanceTo with isLocal=FALSE (global): set child to [30, 0, 0] in WORLD
  await api.v1.assembly.transformInstanceTo({
    id: childET,
    transformation: [[30, 0, 0], [1, 0, 0], [0, 1, 0]],
    isLocal: false,
  })
  const cog1 = (await api.v1.assembly.calculateMassProperties({ id: rootId })).result
  console.log('[04] after global [30,0,0] COG:', JSON.stringify(cog1?.cog))

  await snapshot('after-global')

  // transformInstanceTo with isLocal=TRUE: set child to [30, 0, 0] in OWNER's local frame
  // Owner is rotated 90°Z, so owner's local X = world Y
  // local [30, 0, 0] → world [0, 30, 0]
  await api.v1.assembly.transformInstanceTo({
    id: childET,
    transformation: [[30, 0, 0], [1, 0, 0], [0, 1, 0]],
    isLocal: true,
  })
  const cog2 = (await api.v1.assembly.calculateMassProperties({ id: rootId })).result
  console.log('[04] after local [30,0,0] COG:', JSON.stringify(cog2?.cog))

  await snapshot('after-local')

  filewrite({
    cogBefore: cog0?.cog,
    cogAfterGlobal: cog1?.cog,
    cogAfterLocal: cog2?.cog,
  }, 'isLocal-cogs')

  return { rootId, subInst, childET }
}
