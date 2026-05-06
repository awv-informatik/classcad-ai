export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Template COG = [20, 15, 10] (corner-aligned part.box)

  // Instance with [origin, xDir, yDir] format — offset X=100
  const inst0 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Vec3',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[03] inst0 (vec3):', inst0)

  // Same placement using 4x4 matrix
  // 4x4 identity with translation [100, 0, 0]:
  // [[1,0,0,100],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Mat4x4',
    transformation: [[1, 0, 0, 100], [0, 1, 0, 50], [0, 0, 1, 0], [0, 0, 0, 1]],
  })).result
  console.log('[03] inst1 (4x4):', inst1)

  // 4x4 with rotation (90° around Z) + translation [0, 100, 0]
  // cos90=0, sin90=1 → R = [[0,-1,0],[1,0,0],[0,0,1]]
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Rot4x4',
    transformation: [[0, -1, 0, 0], [1, 0, 0, 100], [0, 0, 1, 0], [0, 0, 0, 1]],
  })).result
  console.log('[03] inst2 (rot 4x4):', inst2)

  await snapshot('matrix-transforms')

  // Verify: root COG
  const rootMass = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[03] root mass:', JSON.stringify(rootMass.result))
  filewrite(rootMass.result, 'root-mass')

  // Predictions:
  // inst0 (vec3 origin=[100,0,0], no rotation): COG = [120, 15, 10]
  // inst1 (4x4 tx=100 ty=50, no rotation): COG = [120, 65, 10]
  // inst2 (4x4 90°Z at [0,100,0]):
  //   local [20,15,10] → rotated: [0,-1,0]*20 + [1,0,0]*15 + [0,0,1]*10 = [-20? wait...
  //   rotation matrix R applied to local COG [20,15,10]:
  //   x' = 0*20 + (-1)*15 + 0*10 = -15
  //   y' = 1*20 + 0*15 + 0*10 = 20
  //   z' = 0*20 + 0*15 + 1*10 = 10
  //   world = [-15+0, 20+100, 10+0] = [-15, 120, 10]
  // Combined: [(120+120-15)/3, (15+65+120)/3, (10+10+10)/3] = [225/3, 200/3, 30/3] = [75, 66.67, 10]
  console.log('[03] predicted combined COG: [75, 66.67, 10]')

  return { inst0, inst1, inst2 }
}
