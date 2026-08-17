export default async function (api, { snapshot, filewrite }) {
  // Test: does reorient shift the zero-angle reference for zRotationLimits?
  // If yes: reorient='90' + limits={min:0, max:0} should force arm to 90° from default
  // If no: all reorient values should give the same result

  const results = {}

  async function testReorientLocked(reorient) {
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

    const r = await api.v1.assembly.revolute({
      id: asmId, name: 'Rev',
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst2], csys: wcsB, reorient },
      zRotationLimits: { min: 0, max: 0 }, // lock at zero angle
    })

    const mass2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
    return { cog: mass2?.cog, maxLevel: r.maxLevel }
  }

  for (const reorient of ['0', '90', '180', '270']) {
    const r = await testReorientLocked(reorient)
    results[`locked_${reorient}`] = r
    console.log(`[08] reorient='${reorient}' locked → COG:`, JSON.stringify(r?.cog), 'maxLevel:', r?.maxLevel)

    if (reorient === '90') await snapshot('reorient90-locked')
    if (reorient === '180') await snapshot('reorient180-locked')
  }

  filewrite(results, 'reorient-locked')
  return {}
}
