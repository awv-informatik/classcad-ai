export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RevErrorTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Arm', length: 15, width: 50, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [0, 25, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'ArmInst',
  })).result

  // Error 1: missing mate2
  const e1 = await api.v1.assembly.revolute({
    id: asmId,
    mate1: { path: [inst1], csys: wcs1 },
  })
  console.log('[08] no mate2: result=', e1.result, 'maxLevel:', e1.maxLevel)
  filewrite({ result: e1.result, messages: e1.messages, maxLevel: e1.maxLevel }, 'err-no-mate2')

  // Error 2: missing mate1
  const e2 = await api.v1.assembly.revolute({
    id: asmId,
    mate2: { path: [inst2], csys: wcs2 },
  })
  console.log('[08] no mate1: result=', e2.result, 'maxLevel:', e2.maxLevel)
  filewrite({ result: e2.result, messages: e2.messages, maxLevel: e2.maxLevel }, 'err-no-mate1')

  // Error 3: self-constraint (same instance in both mates)
  const e3 = await api.v1.assembly.revolute({
    id: asmId,
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst1], csys: wcs1 },
  })
  console.log('[08] self-constraint: result=', e3.result, 'maxLevel:', e3.maxLevel)
  filewrite({ result: e3.result, messages: e3.messages, maxLevel: e3.maxLevel }, 'err-self')

  // Error 4: invalid path ID
  const e4 = await api.v1.assembly.revolute({
    id: asmId,
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [99999], csys: wcs2 },
  })
  console.log('[08] bad path: result=', e4.result, 'maxLevel:', e4.maxLevel)
  filewrite({ result: e4.result, messages: e4.messages, maxLevel: e4.maxLevel }, 'err-bad-path')

  // Error 5: invalid csys ID
  const e5 = await api.v1.assembly.revolute({
    id: asmId,
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: 99999 },
  })
  console.log('[08] bad csys: result=', e5.result, 'maxLevel:', e5.maxLevel)
  filewrite({ result: e5.result, messages: e5.messages, maxLevel: e5.maxLevel }, 'err-bad-csys')

  // Error 6: template ID in path instead of instance ID
  const e6 = await api.v1.assembly.revolute({
    id: asmId,
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [tpl2], csys: wcs2 },
  })
  console.log('[08] tpl-in-path: result=', e6.result, 'maxLevel:', e6.maxLevel)
  filewrite({ result: e6.result, messages: e6.messages, maxLevel: e6.maxLevel }, 'err-tpl-path')

  // Error 7: missing assembly ID
  const e7 = await api.v1.assembly.revolute({
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })
  console.log('[08] no id: result=', e7.result, 'maxLevel:', e7.maxLevel)
  filewrite({ result: e7.result, messages: e7.messages, maxLevel: e7.maxLevel }, 'err-no-id')

  // Error 8: partial zRotationLimits (only min, which failed in script 05)
  const e8 = await api.v1.assembly.revolute({
    id: asmId,
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zRotationLimits: { min: '-45deg' },
  })
  console.log('[08] partial limits: result=', e8.result, 'maxLevel:', e8.maxLevel)
  filewrite({ result: e8.result, messages: e8.messages, maxLevel: e8.maxLevel }, 'err-partial-limits')

  return { asmId }
}
