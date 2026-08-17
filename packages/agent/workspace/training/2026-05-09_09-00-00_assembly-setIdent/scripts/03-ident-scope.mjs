export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'IdentScope' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  const wcsId = (await api.v1.part.workCSys({
    id: tplId, name: 'WCS1',
    origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1'
  })).result
  console.log('[03] inst1:', inst1)

  // Set ident on instance
  await api.v1.assembly.setIdent({ id: inst1, ident: 'box_a' })

  // Set ident on assembly
  const r1 = await api.v1.assembly.setIdent({ id: asmId, ident: 'root' })
  console.log('[03] setIdent on assembly:', r1.maxLevel)

  // Set ident on template
  const r2 = await api.v1.assembly.setIdent({ id: tplId, ident: 'box_tpl' })
  console.log('[03] setIdent on template:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'setIdent-template')

  // Set ident on WCS (work geometry)
  const r3 = await api.v1.assembly.setIdent({ id: wcsId, ident: 'wcs_origin' })
  console.log('[03] setIdent on WCS:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'setIdent-wcs')

  // Now test which APIs accept ident strings:

  // 1. assembly.transformInstance — use proper 4x4 matrix
  const tr = await api.v1.assembly.transformInstance({
    id: 'box_a',
    transformation: [
      [1, 0, 0, 50],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ]
  })
  console.log('[03] transformInstance(ident):', tr.result, 'maxLevel:', tr.maxLevel)
  filewrite({ result: tr.result, messages: tr.messages, maxLevel: tr.maxLevel }, 'transformInstance-ident')

  // 2. assembly.deleteInstance — uses ids array
  // (test this last since it destroys the instance)

  // 3. fastenedOrigin — uses path array which takes instance IDs
  const fo = await api.v1.assembly.fastenedOrigin({
    id: asmId,
    instance: 'box_a',
    name: 'FO1',
    mate1: { path: ['box_a'], csys: wcsId }
  })
  console.log('[03] fastenedOrigin(ident):', fo.result, 'maxLevel:', fo.maxLevel)
  filewrite({ result: fo.result, messages: fo.messages, maxLevel: fo.maxLevel }, 'fastenedOrigin-ident')

  // 4. calculateMassProperties — already shown to not support idents
  // Try with numeric ID to confirm it works at all
  const mp = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[03] massProps(numericId):', mp.result ? 'ok' : 'null', 'maxLevel:', mp.maxLevel)

  await snapshot('ident-scope')

  return { asmId, inst1 }
}
