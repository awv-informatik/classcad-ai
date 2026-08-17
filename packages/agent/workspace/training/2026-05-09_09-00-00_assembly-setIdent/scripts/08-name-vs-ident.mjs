export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'NameVsIdent' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'MyInstance'
  })).result

  // Set ident
  await api.v1.assembly.setIdent({ id: inst1, ident: 'inst_ident' })

  // Set name via common.setObjectName — this is different from ident
  await api.v1.common.setObjectName({ id: inst1, name: 'MyRenamedInstance' })

  // Test: can we look up by name?
  const gi_name = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'MyRenamedInstance' })
  console.log('[08] getInstance by name:', gi_name.result, 'maxLevel:', gi_name.maxLevel)

  // Test: can we look up by old creation name?
  const gi_old = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'MyInstance' })
  console.log('[08] getInstance by old name:', gi_old.result, 'maxLevel:', gi_old.maxLevel)

  // Test: name and ident are independent
  // transformInstance accepts ident but not name
  const tr_ident = await api.v1.assembly.transformInstance({
    id: 'inst_ident',
    transformation: [[1, 0, 0, 40], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
  })
  console.log('[08] transformInstance by ident:', tr_ident.maxLevel)

  const tr_name = await api.v1.assembly.transformInstance({
    id: 'MyRenamedInstance',
    transformation: [[1, 0, 0, 10], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
  })
  console.log('[08] transformInstance by name:', tr_name.maxLevel)
  filewrite({ result: tr_name.result, messages: tr_name.messages }, 'transformInstance-by-name')

  // Test: ident on a constraint
  const wcsId = (await api.v1.part.getWorkGeometry({ id: tplId, name: 'WCS1' })).result
  // Need to get WCS — but we're in assembly context now
  // Create a fresh WCS inside the template
  await api.v1.assembly.setCurrentProduct({ id: tplId })
  const wcs = (await api.v1.part.workCSys({
    id: tplId, name: 'WCS_fo',
    origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, instance: inst1, name: 'FO1',
    mate1: { path: [inst1], csys: wcs }
  })).result
  console.log('[08] fastenedOrigin created:', foId)

  // Set ident on constraint
  const r_set = await api.v1.assembly.setIdent({ id: foId, ident: 'fo_main' })
  console.log('[08] setIdent on constraint:', r_set.maxLevel)
  filewrite({ result: r_set.result, messages: r_set.messages }, 'setIdent-constraint')

  // Verify COG
  const mp = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[08] COG:', JSON.stringify(mp.result?.cog))

  await snapshot('name-vs-ident')

  return { asmId }
}
