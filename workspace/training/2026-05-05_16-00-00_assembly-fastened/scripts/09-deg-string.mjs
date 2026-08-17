export default async function (api, { snapshot, filewrite }) {
  // Test "deg" string syntax for rotations
  const asmId = (await api.v1.assembly.create({})).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 80, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'O', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Ref' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Deg',
    transformation: [[150, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // "90deg" should be equivalent to pi/2 radians
  const r = await api.v1.assembly.fastened({
    id: asmId, name: 'F_Deg',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    zRotation: '90deg',
    xOffset: 100,
  })
  console.log('[09] deg fastened:', r.result, 'maxLevel:', r.maxLevel)

  await api.v1.common.recalc({})

  const mass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[09] COG with zRotation "90deg":', JSON.stringify(mass?.cog))
  // Should match script 07: (62.5, 27.5, 10) if "90deg" = pi/2

  // Also test "45deg"
  // We can't easily modify, but let's get the getFastened to see if deg was stored
  const get = await api.v1.assembly.getFastened({ id: asmId, name: 'F_Deg' })
  console.log('[09] stored zRotation:', get.result?.zRotation)
  // Should be pi/2 ≈ 1.5708 (stored as radians?)

  filewrite({ mass, getResult: get.result }, 'deg-results')

  return { r: r.result }
}
