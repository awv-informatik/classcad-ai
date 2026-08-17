export default async function (api, { snapshot, filewrite }) {
  // Test: does csys origin position affect fastened alignment?
  // Setup: two templates with csys at different positions
  // If csys position matters: inst2 moves to align csys frames
  // If csys position doesn't matter: inst2 just goes to inst1 origin
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: box 40x30x20, csys at the +X face center (40, 15, 10)
  const tplA = (await api.v1.assembly.partTemplate({ name: 'PlateA' })).result
  await api.v1.part.box({ id: tplA, name: 'BA', length: 40, width: 30, height: 20 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'MateA',
    origin: [40, 15, 10], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[04] tplA:', tplA, 'wcsA:', wcsA)

  // Template B: box 40x30x20 (same), csys at -X face center (0, 15, 10)
  const tplB = (await api.v1.assembly.partTemplate({ name: 'PlateB' })).result
  await api.v1.part.box({ id: tplB, name: 'BB', length: 40, width: 30, height: 20 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'MateB',
    origin: [0, 15, 10], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[04] tplB:', tplB, 'wcsB:', wcsB)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Inst1 at origin
  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Inst1',
  })).result

  // Inst2 far away at (200, 0, 0)
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Inst2',
    transformation: [[200, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[04] inst1:', inst1, 'inst2:', inst2)

  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] COG before:', JSON.stringify(massBefore?.cog))
  // inst1 COG = (20,15,10), inst2 COG = (220,15,10), combined = (120,15,10)

  await snapshot('before')

  // Fastened: align MateA on inst1 with MateB on inst2
  // If csys positions matter: inst2 origin = MateA_world - MateB_local = (40,15,10) - (0,15,10) = (40, 0, 0)
  // If csys positions ignored: inst2 origin = (0,0,0)
  const r = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_CsysTest',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })
  console.log('[04] fastened:', r.result, 'maxLevel:', r.maxLevel)

  await api.v1.common.recalc({})
  await snapshot('after')

  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] COG after:', JSON.stringify(massAfter?.cog))
  // If inst2 at (40,0,0): inst2 COG = (60,15,10), combined COG x = (20+60)/2 = 40
  // If inst2 at (0,0,0): combined COG x = (20+20)/2 = 20

  filewrite({ massBefore, massAfter }, 'mass-comparison')

  return { asmId, inst1, inst2 }
}
