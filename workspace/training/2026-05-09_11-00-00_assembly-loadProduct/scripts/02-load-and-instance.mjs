// Load an OFB product into an assembly, instantiate it, verify spatial properties via COG
export default async function (api, { snapshot, filewrite }) {
  // Step 1: Create a part with known geometry, save it
  const partId = (await api.v1.part.create({ name: 'Plate' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Body', length: 60, width: 40, height: 20 })).result
  console.log('[02] Part created:', partId, 'box:', boxId)

  // Save to OFB
  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  const ofbData = saved.result.content

  // Step 2: Create assembly, load product, instantiate
  await api.v1.common.clear({})
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const loadRes = (await api.v1.assembly.loadProduct({ data: ofbData, format: 'OFB', encoding: 'base64', compression: 'deflate' })).result
  const tplId = loadRes.id
  console.log('[02] Loaded template ID:', tplId)

  // Return to assembly context
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instantiate at origin
  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result
  console.log('[02] Instance 1:', inst1)

  // Instantiate at offset [80, 0, 0]
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId,
    ownerId: asmId,
    name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[02] Instance 2:', inst2)

  // Verify spatial: COG of 60x40x20 box is (30,20,10) in local coords
  // inst1 at origin: expected COG = (30, 20, 10)
  // inst2 at [80,0,0]: expected COG = (110, 20, 10)
  const mass1 = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  const mass2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[02] Inst1 COG:', mass1.centerOfGravity)
  console.log('[02] Inst2 COG:', mass2.centerOfGravity)

  filewrite({ inst1COG: mass1.centerOfGravity, inst2COG: mass2.centerOfGravity }, 'cog-comparison')

  await snapshot('two-instances')
  return { tplId, inst1, inst2 }
}
