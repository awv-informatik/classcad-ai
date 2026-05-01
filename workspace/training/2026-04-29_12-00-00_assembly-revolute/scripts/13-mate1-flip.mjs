export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RevMate1FlipTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Arm', length: 10, width: 30, height: 70 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [5, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'ArmInst',
  })).result

  // Test flip on MATE1 (not mate2)
  const r1 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Mate1FlipX',
    mate1: { path: [inst1], csys: wcs1, flip: 'X' },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[13] mate1 flip=X: result=', r1)
  await snapshot('mate1-flip-X')

  // Get to verify mate1 flip is stored
  const g1 = await api.v1.assembly.getRevolute({ id: asmId, name: 'Mate1FlipX' })
  filewrite(g1.result, 'mate1-flipX-data')
  console.log('[13] mate1 flip stored:', g1.result.mate1.flip)

  // Delete and test mate1 flip=Y
  await api.v1.assembly.deleteConstraint({ ids: [r1] })
  const r2 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Mate1FlipY',
    mate1: { path: [inst1], csys: wcs1, flip: 'Y' },
    mate2: { path: [inst2], csys: wcs2 },
  })).result
  console.log('[13] mate1 flip=Y: result=', r2)
  await snapshot('mate1-flip-Y')

  // Test BOTH mates with non-default flips
  await api.v1.assembly.deleteConstraint({ ids: [r2] })
  const r3 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'BothFlips',
    mate1: { path: [inst1], csys: wcs1, flip: 'X' },
    mate2: { path: [inst2], csys: wcs2, flip: '-X' },
  })).result
  console.log('[13] both flips X/-X: result=', r3)
  const g3 = await api.v1.assembly.getRevolute({ id: asmId, name: 'BothFlips' })
  filewrite(g3.result, 'both-flips-data')
  console.log('[13] both flips stored: mate1=', g3.result.mate1.flip, 'mate2=', g3.result.mate2.flip)
  await snapshot('both-flips')

  // Test mate1 reorient
  await api.v1.assembly.deleteConstraint({ ids: [r3] })
  const r4 = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Mate1Reorient',
    mate1: { path: [inst1], csys: wcs1, reorient: '180' },
    mate2: { path: [inst2], csys: wcs2, reorient: '90' },
  })).result
  console.log('[13] reorient mate1=180 mate2=90: result=', r4)
  const g4 = await api.v1.assembly.getRevolute({ id: asmId, name: 'Mate1Reorient' })
  filewrite(g4.result, 'reorient-data')
  console.log('[13] reorients stored: mate1=', g4.result.mate1.reorient, 'mate2=', g4.result.mate2.reorient)
  await snapshot('both-reorients')

  return { asmId }
}
