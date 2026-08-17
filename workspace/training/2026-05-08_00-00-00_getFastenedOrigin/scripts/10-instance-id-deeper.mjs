export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result

  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Test',
    mate1: { path: [inst], csys: wcs },
    xOffset: 25,
  })).result

  // The error message for template/constraint says id types: ["assembly","instance"]
  // But instance ID gave "not a Assembly" error — different error path
  // Let me try the instance ID again and look at the error code more carefully
  const rInst = await api.v1.assembly.getFastenedOrigin({ id: inst, name: 'FO_Test' })
  console.log('[10] instance ID error code:', rInst.messages?.[0]?.code)
  console.log('[10] instance ID error msg:', rInst.messages?.[0]?.message)

  // What about sub-assembly instance ID? The docs say "id of the product or instance"
  // Maybe instance IDs are supposed to work for sub-assembly constraints?
  // For now, document that only assembly root ID works reliably.

  filewrite({
    instanceError: { code: rInst.messages?.[0]?.code, message: rInst.messages?.[0]?.message },
  }, 'instance-id-detail')

  return {}
}
