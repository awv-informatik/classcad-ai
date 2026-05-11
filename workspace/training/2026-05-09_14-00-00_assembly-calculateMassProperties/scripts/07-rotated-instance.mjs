export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Non-symmetric box so rotation changes COG
  const tplId = (await api.v1.assembly.partTemplate({})).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 60, width: 20, height: 10 })
  // Box COG local: (30, 10, 5)
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance 1: at origin, no rotation
  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'NoRotation' })).result

  // Instance 2: 90° rotation around Z axis
  // rotation Z=π/2 → x'=-y, y'=x → local(30,10,5) → world(-10,30,5)
  // Plus translation at (100, 0, 0)
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Rotated90Z',
    transformation: [[100, 0, 0], [0, 1, 0], [-1, 0, 0]],
    // x-dir = (0,1,0) means original X maps to Y
    // y-dir = (-1,0,0) means original Y maps to -X
    // This is a 90° CCW rotation around Z
  })).result

  const r1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  const r2 = await api.v1.assembly.calculateMassProperties({ id: inst2 })
  const rAsm = await api.v1.assembly.calculateMassProperties({ id: asmId })

  console.log('[07] inst1 COG:', JSON.stringify(r1.result.cog), 'vol:', r1.result.volume)
  console.log('[07] inst2 COG:', JSON.stringify(r2.result.cog), 'vol:', r2.result.volume)
  console.log('[07] asm COG:', JSON.stringify(rAsm.result.cog), 'vol:', rAsm.result.volume)

  // Expected inst2 COG: rotation matrix [xDir=(0,1,0), yDir=(-1,0,0)] applied to local(30,10,5)
  // world = translation + R * local
  // R * (30,10,5) = (xDir*30 + yDir*10 + zDir*5) = (0,30,0) + (-10,0,0) + (0,0,5) = (-10, 30, 5)
  // world = (100,0,0) + (-10,30,5) = (90, 30, 5)
  console.log('[07] expected inst2 COG: (90, 30, 5)')
  console.log('[07] match X:', Math.abs(r2.result.cog.x - 90) < 0.01)
  console.log('[07] match Y:', Math.abs(r2.result.cog.y - 30) < 0.01)
  console.log('[07] match Z:', Math.abs(r2.result.cog.z - 5) < 0.01)

  // Assembly COG should be weighted average of inst1 and inst2 (equal volumes)
  const expectedAsmX = (r1.result.cog.x + r2.result.cog.x) / 2
  const expectedAsmY = (r1.result.cog.y + r2.result.cog.y) / 2
  const expectedAsmZ = (r1.result.cog.z + r2.result.cog.z) / 2
  console.log('[07] expected asm COG:', expectedAsmX.toFixed(2), expectedAsmY.toFixed(2), expectedAsmZ.toFixed(2))
  console.log('[07] asm match X:', Math.abs(rAsm.result.cog.x - expectedAsmX) < 0.01)

  filewrite({
    inst1: r1.result,
    inst2: r2.result,
    assembly: rAsm.result,
    expected: { inst2Cog: { x: 90, y: 30, z: 5 }, asmCog: { x: expectedAsmX, y: expectedAsmY, z: expectedAsmZ } },
  }, 'rotated-instance')

  await snapshot('rotated')
  return { asmId }
}
