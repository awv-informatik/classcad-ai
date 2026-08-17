export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_Flip' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Wedge' })).result
  await api.v1.part.box({ id: tpl, name: 'Base', length: 30, width: 20, height: 25 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [15, 10, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const flips = ['Z', '-Z', 'X', '-X', 'Y', '-Y']
  const results = {}

  for (let i = 0; i < flips.length; i++) {
    const flip = flips[i]
    const inst = (await api.v1.assembly.instance({
      productId: tpl, ownerId: asmId, name: `Flip_${flip}`,
    })).result

    const r = await api.v1.assembly.fastenedOrigin({
      id: asmId,
      name: `FO_${flip}`,
      mate1: { path: [inst], csys: wcs, flip },
      xOffset: i * 50,
    })

    console.log(`[05] flip=${flip}: result=${r.result} maxLevel=${r.maxLevel}`)
    results[flip] = { instId: inst, foId: r.result, maxLevel: r.maxLevel }
  }

  filewrite(results, 'flip-results')
  await snapshot('flips')

  return { asmId }
}
