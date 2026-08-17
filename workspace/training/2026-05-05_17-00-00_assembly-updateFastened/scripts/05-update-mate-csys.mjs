export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with template that has TWO workCSys at different positions
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 80, width: 30, height: 20 })
  const wcsA = (await api.v1.part.workCSys({
    id: tpl, name: 'Origin', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const wcsB = (await api.v1.part.workCSys({
    id: tpl, name: 'Corner', origin: [80, 30, 20],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[05] wcsA:', wcsA, 'wcsB:', wcsB)
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst2',
    transformation: [[200, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create fastened with wcsA on both mates, xOffset=100
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsA },
    xOffset: 100,
  })).result
  console.log('[05] fastened created:', fId)

  const m1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[05] COG with csysA/csysA, xOffset=100:', JSON.stringify(m1.cog))
  // Expected: inst2 at x=100, COG (140,15,10). Combined x=(40+140)/2=90

  // Update: swap mate1 csys to wcsB (at corner position)
  const r1 = await api.v1.assembly.updateFastened({ id: fId, mate1: { path: [inst1], csys: wcsB } })
  console.log('[05] update mate1 csys to Corner:', r1.result, 'maxLevel:', r1.maxLevel)

  const m2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[05] COG after mate1 csys change:', JSON.stringify(m2.cog))
  // From previous session: csys position does NOT affect alignment
  // So this should produce the same result? Or does it shift inst2?
  await snapshot('after-mate1-csys-change')

  // Update: swap mate2 csys to wcsB
  const r2 = await api.v1.assembly.updateFastened({ id: fId, mate2: { path: [inst2], csys: wcsB } })
  console.log('[05] update mate2 csys to Corner:', r2.result, 'maxLevel:', r2.maxLevel)

  const m3 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[05] COG after both csys changed to Corner:', JSON.stringify(m3.cog))
  await snapshot('after-both-csys-change')

  // Verify state
  const state = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[05] final mate1.csys:', state.mate1.csys, 'mate2.csys:', state.mate2.csys)
  filewrite(state, 'final-state')

  return { fId }
}
