export default async function (api, { snapshot, filewrite }) {
  // Setup: 3 instances to test swapping mate paths
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 80, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'C',
    transformation: [[200, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[09] inst1:', inst1, 'inst2:', inst2, 'inst3:', inst3)

  // Fastened inst1 to inst2, xOffset=50
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 50,
  })).result
  console.log('[09] fastened inst1→inst2:', fId)

  const m1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[09] COG (inst2 at x=50):', JSON.stringify(m1.cog))
  // inst1 COG (40,15,10), inst2 COG (90,15,10), inst3 COG (240,15,10)
  // Combined: x=(40+90+240)/3≈123.3

  // Update: swap mate2 to inst3 (so inst3 is now constrained to inst1)
  const r1 = await api.v1.assembly.updateFastened({ id: fId, mate2: { path: [inst3], csys: wcs } })
  console.log('[09] update mate2 to inst3:', r1.result, 'maxLevel:', r1.maxLevel)

  const m2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[09] COG after swap to inst3:', JSON.stringify(m2.cog))
  // If the constraint now moves inst3 to x=50 (xOffset preserved):
  // inst1 COG (40,15,10), inst2 COG (140,15,10) [original position restored?], inst3 COG (90,15,10)
  // Or inst2 stays at x=50 and inst3 moves to x=50?
  // Need to see what happens
  await snapshot('after-swap-to-inst3')

  // Verify state
  const state = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[09] mate2 path after swap:', JSON.stringify(state.mate2.path))
  console.log('[09] xOffset:', state.xOffset)
  filewrite({ state, cog: m2.cog }, 'after-swap')

  // Now swap mate1 to inst2 (so constraint is inst2→inst3)
  const r2 = await api.v1.assembly.updateFastened({ id: fId, mate1: { path: [inst2], csys: wcs } })
  console.log('[09] update mate1 to inst2:', r2.result, 'maxLevel:', r2.maxLevel)

  const m3 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[09] COG after mate1=inst2:', JSON.stringify(m3.cog))
  await snapshot('after-mate1-swap')

  const state2 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  filewrite(state2, 'final-state')

  return { fId }
}
