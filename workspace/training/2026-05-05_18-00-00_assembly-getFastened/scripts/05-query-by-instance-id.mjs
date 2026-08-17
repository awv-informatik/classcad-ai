export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'P' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'M', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId,
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.fastened({
    id: asmId, name: 'Joint',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 80,
  })

  // Query via assembly root ID (expected to work)
  const r1 = await api.v1.assembly.getFastened({ id: asmId, name: 'Joint' })
  console.log('[05] query via asmId:', r1.maxLevel, 'result id:', r1.result?.id)

  // Query via instance1 ID (docs say "id of the assembly or instance")
  const r2 = await api.v1.assembly.getFastened({ id: inst1, name: 'Joint' })
  console.log('[05] query via inst1:', r2.maxLevel, 'result:', r2.result?.id ?? r2.result)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'via-inst1')

  // Query via instance2 ID
  const r3 = await api.v1.assembly.getFastened({ id: inst2, name: 'Joint' })
  console.log('[05] query via inst2:', r3.maxLevel, 'result:', r3.result?.id ?? r3.result)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'via-inst2')

  // Query via template ID (should probably fail)
  const r4 = await api.v1.assembly.getFastened({ id: tpl, name: 'Joint' })
  console.log('[05] query via tpl:', r4.maxLevel, 'result:', r4.result?.id ?? r4.result)

  return { asmId }
}
