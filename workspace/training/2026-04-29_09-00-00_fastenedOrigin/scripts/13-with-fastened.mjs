export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_Mixed' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box', length: 60, width: 40, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [30, 20, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Tower' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box', length: 15, width: 15, height: 40 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [7.5, 7.5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const instBase = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'Base' })).result
  const instTower = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'Tower' })).result

  // fastenedOrigin on Base
  const fo = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Base', mate1: { path: [instBase], csys: wcs1 },
  })
  console.log('[13] fastenedOrigin on Base:', fo.result, 'maxLevel:', fo.maxLevel)

  // fastened between Base and Tower (fastened requires both mates)
  const f = await api.v1.assembly.fastened({
    id: asmId, name: 'F_Tower',
    mate1: { path: [instBase], csys: wcs1 },
    mate2: { path: [instTower], csys: wcs2 },
  })
  console.log('[13] fastened (Base→Tower):', f.result, 'maxLevel:', f.maxLevel)

  filewrite({
    fastenedOrigin: { result: fo.result, maxLevel: fo.maxLevel },
    fastened: { result: f.result, maxLevel: f.maxLevel },
  }, 'mixed-results')

  await snapshot('mixed-constraints')

  return { asmId }
}
