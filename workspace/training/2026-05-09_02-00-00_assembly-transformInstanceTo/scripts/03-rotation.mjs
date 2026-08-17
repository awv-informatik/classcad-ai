export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'LongBlock' })).result
  // Elongated box so rotation is visible
  await api.v1.part.box({ id: tplId, name: 'B1', length: 60, width: 20, height: 15 })

  const refTplId = (await api.v1.assembly.partTemplate({ name: 'Ref' })).result
  await api.v1.part.sphere({ id: refTplId, name: 'S1', radius: 5 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Reference sphere at origin
  await api.v1.assembly.instance({ productId: refTplId, ownerId: asmId, name: 'RefSphere' })

  // Instance at identity (no rotation, origin)
  const inst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Block',
  })).result

  await snapshot('before-no-rotation')

  const cog0 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] initial COG:', JSON.stringify(cog0?.cog))

  // Rotate 90° around Z: xDir=[0,1,0], yDir=[-1,0,0]
  // Origin stays at [0,0,0]
  await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[0, 0, 0], [0, 1, 0], [-1, 0, 0]],
  })
  const cog1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] after 90°Z rotation COG:', JSON.stringify(cog1?.cog))

  await snapshot('after-90z')

  // Rotate 90° around X at origin [50, 0, 0]: xDir=[1,0,0], yDir=[0,0,1]
  await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[50, 0, 0], [1, 0, 0], [0, 0, 1]],
  })
  const cog2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] after 90°X rotation at [50,0,0] COG:', JSON.stringify(cog2?.cog))

  await snapshot('after-90x-at-50')

  // Expected COG for 90°Z at origin: box local COG [30,10,7.5] rotated 90°Z → [-10,30,7.5]
  // But since sphere ref is also in assembly COG, need to compute weighted average
  // Actually, let's just look at the block's contribution
  // For single block after 90°Z: local [30,10,7.5] rotated → [-10,30,7.5]
  // For single block after 90°X at [50,0,0]: local [30,10,7.5] with 90°X rotation
  //   x stays at 30, y->-7.5, z->10 → + origin [50,0,0] = [80,-7.5,10]
  filewrite({
    cogBefore: cog0?.cog,
    cogAfter90Z: cog1?.cog,
    cogAfter90XAt50: cog2?.cog,
  }, 'rotation-cogs')

  return { inst, asmId }
}
