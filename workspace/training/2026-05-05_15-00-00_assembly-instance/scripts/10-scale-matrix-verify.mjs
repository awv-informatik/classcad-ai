export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  // template COG: [20, 15, 10], volume: 24000
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Normal instance at origin
  const inst0 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Normal',
  })).result

  // 2x scale matrix (should be ignored per docs)
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Scaled2x',
    transformation: [[2, 0, 0, 80], [0, 2, 0, 0], [0, 0, 2, 0], [0, 0, 0, 1]],
  })).result

  await snapshot('scale-test')

  // Measure each via root (combined)
  const rootMass = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[10] root mass:', JSON.stringify(rootMass.result))
  filewrite(rootMass.result, 'root-mass')

  // If scaling ignored: inst1 COG = [80+20, 15, 10] = [100, 15, 10]
  // Combined: [(20+100)/2, 15, 10] = [60, 15, 10], volume = 48000
  // If scaling applied: inst1 COG = [80+2*20, 2*15, 2*10] = [120, 30, 20]
  // Combined COG and different volume
  console.log('[10] if scale ignored: combined COG=[60,15,10] vol=48000')
  console.log('[10] if scale applied: combined COG=[70,22.5,15] vol=24000+192000=216000')

  return { inst0, inst1 }
}
