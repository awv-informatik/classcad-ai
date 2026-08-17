export default async function (api, { snapshot, filewrite }) {
  // Test: do csys AXES affect fastened alignment?
  // Template A: csys with default axes
  // Template B: csys with X rotated 90° around Z (so local X points along world Y)
  // If axes matter: inst2 should be rotated 90° relative to inst1
  // If axes don't matter: inst2 stays un-rotated
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: box 80x30x20, csys default axes at origin
  const tplA = (await api.v1.assembly.partTemplate({ name: 'PlateA' })).result
  await api.v1.part.box({ id: tplA, name: 'BA', length: 80, width: 30, height: 20 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'MA',
    origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Template B: box 60x40x20 (asymmetric for rotation detection), csys rotated 90° around Z
  const tplB = (await api.v1.assembly.partTemplate({ name: 'PlateB' })).result
  await api.v1.part.box({ id: tplB, name: 'BB', length: 60, width: 40, height: 20 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'MB',
    origin: [0, 0, 0], xDirection: [0, 1, 0], yDirection: [-1, 0, 0],  // 90° CCW around Z
  })).result

  console.log('[05] tplA:', tplA, 'wcsA:', wcsA, 'tplB:', tplB, 'wcsB:', wcsB)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Inst1 at origin, inst2 far away
  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Inst1',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Inst2',
    transformation: [[150, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[05] COG before:', JSON.stringify(massBefore?.cog))
  // tplA COG = (40,15,10), tplB at (150,0,0) COG = (180,20,10)
  // volumes: 80*30*20=48000, 60*40*20=48000

  await snapshot('before')

  const r = await api.v1.assembly.fastened({
    id: asmId, name: 'F_RotTest',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })
  console.log('[05] fastened:', r.result, 'maxLevel:', r.maxLevel)

  await api.v1.common.recalc({})
  await snapshot('after')

  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[05] COG after:', JSON.stringify(massAfter?.cog))
  // If rotation matters: inst2 is rotated, its COG changes from (30,20,10) to something else
  // If no rotation: inst2 COG stays at (30,20,10), combined COG = (40+30)/2, (15+20)/2, (10+10)/2 = (35, 17.5, 10)
  // If rotated 90° CCW: tplB's local COG (30,20,10) rotates to (-20,30,10)?
  // Actually let me think... if inst2 is rotated 90° CCW around Z, a point (x,y,z) -> (-y,x,z)
  // So (30,20,10) -> (-20,30,10). Combined: (40+(-20))/2 = 10, (15+30)/2 = 22.5

  filewrite({ massBefore, massAfter }, 'mass-comparison')

  return { asmId }
}
