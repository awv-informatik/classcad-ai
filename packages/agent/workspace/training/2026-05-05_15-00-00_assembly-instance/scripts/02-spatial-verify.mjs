export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with one template containing a box (40×30×20)
  // part.box is corner-aligned: box spans [0,0,0] to [40,30,20]
  // so template-local COG = [20, 15, 10]
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })).result

  // Measure template COG in template-local coords
  const tplMass = await api.v1.assembly.calculateMassProperties({ id: tplId })
  console.log('[02] template COG:', JSON.stringify(tplMass.result))

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance 0: at origin (default transform)
  const inst0 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Origin',
  })).result
  console.log('[02] inst0:', inst0)

  // Instance 1: offset X=80
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'OffsetX',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[02] inst1:', inst1)

  // Instance 2: offset Y=80, rotated 90° around Z
  // 90° Z rotation: xDir=[0,1,0], yDir=[-1,0,0]
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'RotatedY',
    transformation: [[0, 80, 0], [0, 1, 0], [-1, 0, 0]],
  })).result
  console.log('[02] inst2:', inst2)

  await snapshot('layout')

  // Measure combined mass via root assembly (safe, won't materialize)
  const rootMass = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[02] root assembly mass:', JSON.stringify(rootMass.result))
  filewrite(rootMass.result, 'root-mass')

  // Dump the full structure tree (after all instances created) from a recalc
  await api.v1.common.recalc({})
  const r = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[02] all instances:', JSON.stringify(r.result))

  // Dump structure for transform inspection
  const structR = await api.v1.common.getAppVersion({})
  filewrite(structR.structure, 'full-structure')

  // Predicted combined COG:
  // inst0: COG = [0+20, 0+15, 0+10] = [20, 15, 10]
  // inst1: COG = [80+20, 0+15, 0+10] = [100, 15, 10]
  // inst2: rotated 90°Z at origin [0,80,0]. rotation maps local [20,15,10] to:
  //   xDir=[0,1,0] so local_x=20 maps to world_y=20
  //   yDir=[-1,0,0] so local_y=15 maps to world_x=-15
  //   zDir from cross product = [0,0,1], local_z=10 maps to world_z=10
  //   world COG = [0-15, 80+20, 0+10] = [-15, 100, 10]
  // Combined COG = mean of three: [(20+100-15)/3, (15+15+100)/3, (10+10+10)/3]
  //   = [105/3, 130/3, 30/3] = [35, 43.33, 10]
  console.log('[02] predicted combined COG: [35, 43.33, 10]')

  return { inst0, inst1, inst2 }
}
