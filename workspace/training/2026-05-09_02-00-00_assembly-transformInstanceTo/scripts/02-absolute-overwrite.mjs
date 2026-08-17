export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 30, width: 20, height: 15 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instance at [10, 0, 0]
  const inst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
    transformation: [[10, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Measure COG at initial position
  const cog0 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] initial COG:', JSON.stringify(cog0?.cog))

  // transformInstanceTo — set to [50, 30, 0] (absolute)
  await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[50, 30, 0], [1, 0, 0], [0, 1, 0]],
  })
  const cog1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] after first transformInstanceTo [50,30,0] COG:', JSON.stringify(cog1?.cog))

  // transformInstanceTo AGAIN — set to [100, 0, 20] (should OVERWRITE, not add)
  await api.v1.assembly.transformInstanceTo({
    id: inst,
    transformation: [[100, 0, 20], [1, 0, 0], [0, 1, 0]],
  })
  const cog2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[02] after second transformInstanceTo [100,0,20] COG:', JSON.stringify(cog2?.cog))

  // If absolute: COG2 should be at ~[115, 10, 27.5] (origin [100,0,20] + half box [15,10,7.5])
  // If relative: COG2 would be at origin + [50+100, 30+0, 0+20] — different
  // part.box is corner-anchored, so COG = origin + [length/2, width/2, height/2] = [15, 10, 7.5]

  filewrite({
    cogInitial: cog0?.cog,
    cogAfterFirst: cog1?.cog,
    cogAfterSecond: cog2?.cog,
    expectedIfAbsolute: { first: [65, 40, 7.5], second: [115, 10, 27.5] },
  }, 'cog-comparison')

  await snapshot('final')

  return { inst, asmId }
}
