export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_Reorient' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'LBlock' })).result
  await api.v1.part.box({ id: tpl, name: 'Long', length: 50, width: 15, height: 10 })
  await api.v1.part.box({ id: tpl, name: 'Tab', length: 15, width: 30, height: 10 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const reorients = ['0', '90', '180', '270']
  const results = {}

  for (let i = 0; i < reorients.length; i++) {
    const reorient = reorients[i]
    const inst = (await api.v1.assembly.instance({
      productId: tpl, ownerId: asmId, name: `Reorient_${reorient}`,
    })).result

    const r = await api.v1.assembly.fastenedOrigin({
      id: asmId,
      name: `FO_${reorient}`,
      mate1: { path: [inst], csys: wcs, reorient },
      yOffset: i * 60,
    })

    console.log(`[06] reorient=${reorient}: result=${r.result} maxLevel=${r.maxLevel}`)
    results[reorient] = { instId: inst, foId: r.result, maxLevel: r.maxLevel }
  }

  filewrite(results, 'reorient-results')
  await snapshot('reorients')

  return { asmId }
}
