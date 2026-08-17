export default async function (api, { snapshot, filewrite }) {
  // Clean flip test: exactly 2 instances, measure COG to verify rotation
  const asmId = (await api.v1.assembly.create({})).result

  // Asymmetric box: 80x30x20 so we can detect rotation by COG
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 80, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'O', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  // Box COG local = (40, 15, 10)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test A: flip='-Z' on mate2 (only 2 instances)
  {
    const i1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Ref' })).result
    const i2 = (await api.v1.assembly.instance({
      productId: tpl, ownerId: asmId, name: 'Flipped',
      transformation: [[200, 0, 0], [1, 0, 0], [0, 1, 0]],
    })).result

    const r = await api.v1.assembly.fastened({
      id: asmId, name: 'F_NegZ',
      mate1: { path: [i1], csys: wcs },
      mate2: { path: [i2], csys: wcs, flip: '-Z' },
      xOffset: 100,
    })
    console.log('[12] flip -Z fastened:', r.result, 'maxLevel:', r.maxLevel)

    await api.v1.common.recalc({})
    const mass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
    console.log('[12] flip -Z COG:', JSON.stringify(mass?.cog))
    // inst1 COG = (40, 15, 10)
    // If flip -Z = 180° around X: (40,15,10) → (40,-15,-10), + xOffset=100 → (140,-15,-10)
    // Combined: x=(40+140)/2=90, y=(15+(-15))/2=0, z=(10+(-10))/2=0
    // If flip -Z = 180° around Y: (40,15,10) → (-40,15,-10), + xOffset=100 → (60,15,-10)
    // Combined: x=(40+60)/2=50, y=15, z=0

    await snapshot('flip-negZ-only', { view: 'front' })
    filewrite(mass, 'mass-flip-negZ')

    // Cleanup: delete instances
    await api.v1.assembly.deleteInstance({ ids: [i1, i2] })
  }

  // Test B: flip='X' on mate2
  {
    const i1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Ref2' })).result
    const i2 = (await api.v1.assembly.instance({
      productId: tpl, ownerId: asmId, name: 'FlipX',
      transformation: [[200, 0, 0], [1, 0, 0], [0, 1, 0]],
    })).result

    const r = await api.v1.assembly.fastened({
      id: asmId, name: 'F_X',
      mate1: { path: [i1], csys: wcs },
      mate2: { path: [i2], csys: wcs, flip: 'X' },
      xOffset: 100,
    })
    console.log('[12] flip X fastened:', r.result, 'maxLevel:', r.maxLevel)

    await api.v1.common.recalc({})
    const mass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
    console.log('[12] flip X COG:', JSON.stringify(mass?.cog))

    await snapshot('flip-X-only', { view: 'front' })
    filewrite(mass, 'mass-flip-X')

    await api.v1.assembly.deleteInstance({ ids: [i1, i2] })
  }

  // Test C: reorient='90' on mate2
  {
    const i1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Ref3' })).result
    const i2 = (await api.v1.assembly.instance({
      productId: tpl, ownerId: asmId, name: 'Reoriented',
      transformation: [[200, 0, 0], [1, 0, 0], [0, 1, 0]],
    })).result

    const r = await api.v1.assembly.fastened({
      id: asmId, name: 'F_R90',
      mate1: { path: [i1], csys: wcs },
      mate2: { path: [i2], csys: wcs, reorient: '90' },
      xOffset: 100,
    })
    console.log('[12] reorient 90 fastened:', r.result, 'maxLevel:', r.maxLevel)

    await api.v1.common.recalc({})
    const mass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
    console.log('[12] reorient 90 COG:', JSON.stringify(mass?.cog))
    // reorient='90' should be 90° around the main axis (Z by default)
    // If around Z: (40,15,10) → (-15,40,10), + xOffset=100 → (85,40,10)
    // Combined: x=(40+85)/2=62.5, y=(15+40)/2=27.5, z=10

    await snapshot('reorient-90-only', { view: 'top' })
    filewrite(mass, 'mass-reorient-90')
  }

  return {}
}
