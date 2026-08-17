export default async function (api, { snapshot, filewrite }) {
  // Test: flip and reorient parameters on mates
  // flip changes which axis is "up" (Z, -Z, X, -X, Y, -Y)
  // reorient rotates around the main axis in 90° steps
  const asmId = (await api.v1.assembly.create({})).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 80, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'O', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Ref' })).result

  // Test A: mate2 with flip='-Z' (flip Z axis — upside down?)
  const inst2a = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'FlipZ',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const rA = await api.v1.assembly.fastened({
    id: asmId, name: 'F_FlipZ',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2a], csys: wcs, flip: '-Z' },
    xOffset: 100,
  })
  console.log('[11] flip -Z:', rA.result, 'maxLevel:', rA.maxLevel)

  await api.v1.common.recalc({})
  const massA = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[11] COG with flip -Z, xOffset=100:', JSON.stringify(massA?.cog))
  // If flip -Z means inst2 is upside down:
  // normal COG = (40,15,10), flipped around Z = ? depends on semantics
  // If flip means 180° rotation around some axis, COG Y or Z might negate

  await snapshot('flip-negZ')

  // Test B: mate2 with flip='X' (X as main axis — 90° tilt?)
  const inst2b = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'FlipX',
    transformation: [[200, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const rB = await api.v1.assembly.fastened({
    id: asmId, name: 'F_FlipX',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2b], csys: wcs, flip: 'X' },
    xOffset: 200,
  })
  console.log('[11] flip X:', rB.result, 'maxLevel:', rB.maxLevel)

  await api.v1.common.recalc({})
  await snapshot('flip-X')

  // Test C: reorient='90' on mate2
  const inst2c = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Reorient90',
    transformation: [[300, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const rC = await api.v1.assembly.fastened({
    id: asmId, name: 'F_Reorient90',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2c], csys: wcs, reorient: '90' },
    xOffset: 300,
  })
  console.log('[11] reorient 90:', rC.result, 'maxLevel:', rC.maxLevel)

  await api.v1.common.recalc({})
  await snapshot('reorient-90')

  // Get all constraints to see stored state
  const gA = (await api.v1.assembly.getFastened({ id: asmId, name: 'F_FlipZ' })).result
  const gB = (await api.v1.assembly.getFastened({ id: asmId, name: 'F_FlipX' })).result
  const gC = (await api.v1.assembly.getFastened({ id: asmId, name: 'F_Reorient90' })).result
  filewrite({ flipZ: gA, flipX: gB, reorient90: gC }, 'constraint-states')

  return { rA: rA.result, rB: rB.result, rC: rC.result }
}
