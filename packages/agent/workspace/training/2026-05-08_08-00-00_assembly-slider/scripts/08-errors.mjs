export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 20, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Inst1'
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Inst2',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  const errors = {}

  // Error 1: same instance both mates
  const r1 = await api.v1.assembly.slider({
    id: asmId, name: 'Err1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst1], csys: wcsA }
  })
  errors.sameInstance = { result: r1.result, maxLevel: r1.maxLevel, msg: r1.messages?.[0]?.message, code: r1.messages?.[0]?.code }
  console.log('[08] same inst:', r1.result, 'maxLevel:', r1.maxLevel, 'msg:', r1.messages?.[0]?.message)

  // Error 2: invalid flip
  const r2 = await api.v1.assembly.slider({
    id: asmId, name: 'Err2',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsA, flip: 'W' }
  })
  errors.invalidFlip = { result: r2.result, maxLevel: r2.maxLevel, msg: r2.messages?.[0]?.message, code: r2.messages?.[0]?.code }
  console.log('[08] invalid flip:', r2.result, 'maxLevel:', r2.maxLevel, 'msg:', r2.messages?.[0]?.message)

  // Error 3: invalid reorient
  const r3 = await api.v1.assembly.slider({
    id: asmId, name: 'Err3',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsA, reorient: '45' }
  })
  errors.invalidReorient = { result: r3.result, maxLevel: r3.maxLevel, msg: r3.messages?.[0]?.message, code: r3.messages?.[0]?.code }
  console.log('[08] invalid reorient:', r3.result, 'maxLevel:', r3.maxLevel, 'msg:', r3.messages?.[0]?.message)

  // Error 4: missing mate2
  const r4 = await api.v1.assembly.slider({
    id: asmId, name: 'Err4',
    mate1: { path: [inst1], csys: wcsA }
  })
  errors.missingMate2 = { result: r4.result, maxLevel: r4.maxLevel, msg: r4.messages?.[0]?.message, code: r4.messages?.[0]?.code }
  console.log('[08] missing mate2:', r4.result, 'maxLevel:', r4.maxLevel, 'msg:', r4.messages?.[0]?.message)

  // Error 5: missing csys
  const r5 = await api.v1.assembly.slider({
    id: asmId, name: 'Err5',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2] }
  })
  errors.missingCsys = { result: r5.result, maxLevel: r5.maxLevel, msg: r5.messages?.[0]?.message, code: r5.messages?.[0]?.code }
  console.log('[08] missing csys:', r5.result, 'maxLevel:', r5.maxLevel, 'msg:', r5.messages?.[0]?.message)

  filewrite(errors, 'errors-data')
  return errors
}
