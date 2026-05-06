export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Create a part template with a box
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  // template COG: [20, 15, 10]

  // Create a sub-assembly template
  const subAsmTplId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  console.log('[05] subAsmTplId:', subAsmTplId)

  // Instance the box into the sub-assembly at local [50, 0, 0]
  const subInst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: subAsmTplId, name: 'SubBox',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[05] subInst:', subInst)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the sub-assembly into root at global [100, 0, 0]
  const rootInst = (await api.v1.assembly.instance({
    productId: subAsmTplId, ownerId: asmId, name: 'SubAsmInst',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[05] rootInst (sub-asm):', rootInst)

  // Now test isLocal: create another instance inside the sub-assembly instance
  // with isLocal=TRUE — transform should be relative to the sub-assembly's frame
  // vs isLocal=FALSE (default) — transform is global

  // isLocal=FALSE (default): put at global [200, 0, 0]
  const globalInst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: rootInst, name: 'GlobalChild',
    transformation: [[200, 0, 0], [1, 0, 0], [0, 1, 0]],
    isLocal: 0,
  })).result
  console.log('[05] globalInst (isLocal=FALSE):', globalInst)

  // isLocal=TRUE: put at local [30, 0, 0] relative to sub-assembly's frame
  // Sub-asm is at global [100, 0, 0], so this should be at global [130, 0, 0]
  const localInst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: rootInst, name: 'LocalChild',
    transformation: [[30, 0, 0], [1, 0, 0], [0, 1, 0]],
    isLocal: 1,
  })).result
  console.log('[05] localInst (isLocal=TRUE):', localInst)

  await snapshot('isLocal-test')

  // Verify with root mass
  const rootMass = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[05] root mass:', JSON.stringify(rootMass.result))
  filewrite(rootMass.result, 'root-mass')

  // Predictions:
  // subInst: box at local [50,0,0] inside sub-asm at global [100,0,0]
  //   → world COG = [100+50+20, 0+0+15, 0+0+10] = [170, 15, 10]
  // globalInst: at global [200,0,0], isLocal=FALSE
  //   → world COG = [200+20, 0+15, 0+10] = [220, 15, 10]
  // localInst: at local [30,0,0] relative to sub-asm frame at [100,0,0]
  //   → world COG = [100+30+20, 0+0+15, 0+0+10] = [150, 15, 10]
  // Combined: [(170+220+150)/3, (15+15+15)/3, (10+10+10)/3] = [540/3, 45/3, 30/3] = [180, 15, 10]
  console.log('[05] predicted combined COG: [180, 15, 10]')

  return { rootInst, globalInst, localInst }
}
