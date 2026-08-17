export default async function (api, { snapshot, filewrite }) {
  // Setup
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 80, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst2',
    transformation: [[150, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create fastened with xOffset=100, default flip/reorient
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 100,
  })).result

  // Baseline COG: inst1 at origin COG (40,15,10), inst2 at xOffset=100 COG (140,15,10)
  const m0 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] baseline COG (no flip):', JSON.stringify(m0.cog))

  // Update mate2 flip to '-Z' (180° around X — flips Y,Z)
  const r1 = await api.v1.assembly.updateFastened({ id: fId, mate2: { path: [inst2], csys: wcs, flip: '-Z' } })
  console.log('[04] update mate2 flip=-Z:', r1.result, 'maxLevel:', r1.maxLevel)

  const m1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] COG after flip=-Z:', JSON.stringify(m1.cog))
  // flip '-Z' = 180° around X: local (40,15,10) → (40,-15,-10)
  // + xOffset=100: (140, -15, -10)
  // Combined: x=(40+140)/2=90, y=(15-15)/2=0, z=(10-10)/2=0
  await snapshot('after-flip-negZ')

  // Update mate2 flip to 'X' (90° around Y: (x,y,z)→(-z,y,x))
  const r2 = await api.v1.assembly.updateFastened({ id: fId, mate2: { path: [inst2], csys: wcs, flip: 'X' } })
  console.log('[04] update mate2 flip=X:', r2.result, 'maxLevel:', r2.maxLevel)

  const m2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] COG after flip=X:', JSON.stringify(m2.cog))
  // flip 'X' = 90° around Y: local (40,15,10) → (-10,15,40)
  // + xOffset=100: (90, 15, 40)
  // Combined: x=(40+90)/2=65, y=(15+15)/2=15, z=(10+40)/2=25
  await snapshot('after-flip-X')

  // Update mate2 reorient to '90' (CW 90° around main axis Z)
  const r3 = await api.v1.assembly.updateFastened({ id: fId, mate2: { path: [inst2], csys: wcs, flip: 'Z', reorient: '90' } })
  console.log('[04] update reorient=90:', r3.result, 'maxLevel:', r3.maxLevel)

  const m3 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] COG after reorient=90:', JSON.stringify(m3.cog))
  // reorient '90' = -90° CW around Z: (x,y,z) → (y,-x,z)
  // local (40,15,10) → (15,-40,10)
  // + xOffset=100: (115, -40, 10)
  // Combined: x=(40+115)/2=77.5, y=(15-40)/2=-12.5, z=(10+10)/2=10
  await snapshot('after-reorient-90')

  // Verify final state
  const state = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  console.log('[04] final state flip1:', state.mate1.flip, 'flip2:', state.mate2.flip, 'reorient2:', state.mate2.reorient)
  filewrite(state, 'final-state')

  return { fId }
}
