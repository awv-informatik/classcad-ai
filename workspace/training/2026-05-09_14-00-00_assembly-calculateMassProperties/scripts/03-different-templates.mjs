export default async function (api, { snapshot, filewrite }) {
  // Two different templates with different volumes
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: small box (20x20x20 = 8000 mm³)
  const tplA = (await api.v1.assembly.partTemplate({})).result
  await api.v1.part.box({ id: tplA, name: 'SmallBox', length: 20, width: 20, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Template B: large box (60x40x30 = 72000 mm³)
  const tplB = (await api.v1.assembly.partTemplate({})).result
  await api.v1.part.box({ id: tplB, name: 'LargeBox', length: 60, width: 40, height: 30 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance of small box at origin
  const instA = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Small' })).result

  // Instance of large box at X=100
  const instB = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Large',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const rA = await api.v1.assembly.calculateMassProperties({ id: instA })
  const rB = await api.v1.assembly.calculateMassProperties({ id: instB })
  const rAsm = await api.v1.assembly.calculateMassProperties({ id: asmId })

  console.log('[03] instA COG:', JSON.stringify(rA.result.cog), 'vol:', rA.result.volume)
  console.log('[03] instB COG:', JSON.stringify(rB.result.cog), 'vol:', rB.result.volume)
  console.log('[03] asm COG:', JSON.stringify(rAsm.result.cog), 'vol:', rAsm.result.volume)

  // Volume-weighted COG: (volA * cogA.x + volB * cogB.x) / (volA + volB)
  const totalVol = rA.result.volume + rB.result.volume
  const expectedCogX = (rA.result.volume * rA.result.cog.x + rB.result.volume * rB.result.cog.x) / totalVol
  const expectedCogY = (rA.result.volume * rA.result.cog.y + rB.result.volume * rB.result.cog.y) / totalVol
  const expectedCogZ = (rA.result.volume * rA.result.cog.z + rB.result.volume * rB.result.cog.z) / totalVol

  console.log('[03] expected COG:', expectedCogX.toFixed(2), expectedCogY.toFixed(2), expectedCogZ.toFixed(2))
  console.log('[03] actual COG:', rAsm.result.cog.x.toFixed(2), rAsm.result.cog.y.toFixed(2), rAsm.result.cog.z.toFixed(2))
  console.log('[03] match X:', Math.abs(expectedCogX - rAsm.result.cog.x) < 0.01)
  console.log('[03] match Y:', Math.abs(expectedCogY - rAsm.result.cog.y) < 0.01)
  console.log('[03] match Z:', Math.abs(expectedCogZ - rAsm.result.cog.z) < 0.01)
  console.log('[03] vol match:', Math.abs(totalVol - rAsm.result.volume) < 0.01)

  filewrite({
    instA: rA.result,
    instB: rB.result,
    assembly: rAsm.result,
    expected: { cogX: expectedCogX, cogY: expectedCogY, cogZ: expectedCogZ, totalVol },
  }, 'different-templates')

  await snapshot('different-templates')
  return { asmId }
}
