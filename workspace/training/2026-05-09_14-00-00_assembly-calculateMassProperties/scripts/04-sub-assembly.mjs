export default async function (api, { snapshot, filewrite }) {
  // Root assembly with a sub-assembly containing two instances
  const asmId = (await api.v1.assembly.create({})).result

  // Part template: box 40x30x20
  const tplId = (await api.v1.assembly.partTemplate({})).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Sub-assembly template
  const subAsmTpl = (await api.v1.assembly.assemblyTemplate({})).result

  // Add two instances of the box inside the sub-assembly
  const subInst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: subAsmTpl, name: 'SubBox1',
  })).result
  const subInst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: subAsmTpl, name: 'SubBox2',
    transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the sub-assembly at X=100 in the root
  const subAsmInst = (await api.v1.assembly.instance({
    productId: subAsmTpl, ownerId: asmId, name: 'SubAsm1',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Also add a direct part instance at origin
  const directInst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Direct',
  })).result

  // Measure sub-assembly instance
  const rSubAsm = await api.v1.assembly.calculateMassProperties({ id: subAsmInst })
  console.log('[04] sub-asm inst COG:', JSON.stringify(rSubAsm.result.cog), 'vol:', rSubAsm.result.volume)

  // Measure sub-assembly template
  const rSubAsmTpl = await api.v1.assembly.calculateMassProperties({ id: subAsmTpl })
  console.log('[04] sub-asm template COG:', JSON.stringify(rSubAsmTpl.result.cog), 'vol:', rSubAsmTpl.result.volume)

  // Measure direct instance
  const rDirect = await api.v1.assembly.calculateMassProperties({ id: directInst })
  console.log('[04] direct inst COG:', JSON.stringify(rDirect.result.cog), 'vol:', rDirect.result.volume)

  // Measure root assembly
  const rRoot = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[04] root asm COG:', JSON.stringify(rRoot.result.cog), 'vol:', rRoot.result.volume)

  // Expected:
  // Direct inst: COG at (20, 15, 10), vol 24000
  // Sub-asm template local: subInst1 at origin COG (20,15,10), subInst2 at Y+50 COG (20,65,10)
  //   sub-asm template COG: (20, 40, 10), vol 48000
  // Sub-asm instance at X+100: COG shifted by (100,0,0) → (120, 40, 10), vol 48000
  // Root: weighted avg of direct(24000 @ 20,15,10) + subAsm(48000 @ 120,40,10)
  //   X: (24000*20 + 48000*120) / 72000 = (480000 + 5760000) / 72000 = 86.67
  //   Y: (24000*15 + 48000*40) / 72000 = (360000 + 1920000) / 72000 = 31.67
  //   Z: (24000*10 + 48000*10) / 72000 = 10
  //   vol: 72000

  const totalVol = rDirect.result.volume + rSubAsm.result.volume
  const expectedX = (rDirect.result.volume * rDirect.result.cog.x + rSubAsm.result.volume * rSubAsm.result.cog.x) / totalVol
  const expectedY = (rDirect.result.volume * rDirect.result.cog.y + rSubAsm.result.volume * rSubAsm.result.cog.y) / totalVol
  const expectedZ = (rDirect.result.volume * rDirect.result.cog.z + rSubAsm.result.volume * rSubAsm.result.cog.z) / totalVol

  console.log('[04] expected root COG:', expectedX.toFixed(2), expectedY.toFixed(2), expectedZ.toFixed(2))
  console.log('[04] match X:', Math.abs(expectedX - rRoot.result.cog.x) < 0.01)
  console.log('[04] match Y:', Math.abs(expectedY - rRoot.result.cog.y) < 0.01)
  console.log('[04] match Z:', Math.abs(expectedZ - rRoot.result.cog.z) < 0.01)
  console.log('[04] vol match:', Math.abs(totalVol - rRoot.result.volume) < 0.01)

  filewrite({
    subAsmInstance: rSubAsm.result,
    subAsmTemplate: rSubAsmTpl.result,
    directInstance: rDirect.result,
    rootAssembly: rRoot.result,
    expected: { cogX: expectedX, cogY: expectedY, cogZ: expectedZ, totalVol },
  }, 'sub-assembly-results')

  await snapshot('sub-assembly')
  return { asmId }
}
