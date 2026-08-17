export default async function (api, { snapshot, filewrite }) {
  const results = {}

  async function testFlip(flip, reorient) {
    await api.v1.common.clear({})
    const asmId = (await api.v1.assembly.create({})).result

    const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
    await api.v1.part.box({ id: tplA, name: 'BoxA', length: 60, width: 40, height: 10 })
    const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'CsysA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

    const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
    await api.v1.part.box({ id: tplB, name: 'BoxB', length: 80, width: 20, height: 8 })
    const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'CsysB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

    await api.v1.assembly.setCurrentProduct({ id: asmId })

    const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
    const inst2 = (await api.v1.assembly.instance({
      productId: tplB, ownerId: asmId, name: 'Arm',
      transformation: [[100, 50, 30], [1, 0, 0], [0, 1, 0]],
    })).result

    await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'G', mate1: { path: [inst1], csys: wcsA } })

    const mate2 = { path: [inst2], csys: wcsB }
    if (flip) mate2.flip = flip
    if (reorient) mate2.reorient = reorient

    const r = await api.v1.assembly.revolute({
      id: asmId, name: 'Rev',
      mate1: { path: [inst1], csys: wcsA },
      mate2,
    })

    if (r.maxLevel > 31) {
      console.log(`[07] ${flip||'Z'}/${reorient||'0'} ERROR maxLevel:`, r.maxLevel, JSON.stringify(r.messages))
      return null
    }

    const mass2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
    return { cog: mass2?.cog, asmId, inst1, inst2 }
  }

  // Test flips
  for (const flip of ['Z', '-Z', 'X', '-X', 'Y', '-Y']) {
    const r = await testFlip(flip, null)
    results[`flip_${flip}`] = r?.cog
    console.log(`[07] flip='${flip}' → COG:`, JSON.stringify(r?.cog))
    if (flip === '-Z') await snapshot('flip-minusZ')
    if (flip === 'X') await snapshot('flip-X')
    if (flip === 'Y') await snapshot('flip-Y')
  }

  // Test reorients (default flip='Z')
  for (const reorient of ['0', '90', '180', '270']) {
    const r = await testFlip(null, reorient)
    results[`reorient_${reorient}`] = r?.cog
    console.log(`[07] reorient='${reorient}' → COG:`, JSON.stringify(r?.cog))
    if (reorient === '90') await snapshot('reorient-90')
  }

  filewrite(results, 'flip-reorient-results')
  return {}
}
