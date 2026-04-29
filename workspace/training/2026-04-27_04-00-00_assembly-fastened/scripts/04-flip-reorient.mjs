export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FlipTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box', length: 60, width: 40, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [30, 20, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arrow' })).result
  // Asymmetric shape to visualize orientation: long box + small offset box
  await api.v1.part.box({ id: tpl2, name: 'Shaft', length: 40, width: 10, height: 10 })
  await api.v1.part.box({ id: tpl2, name: 'Head', length: 10, width: 20, height: 10,
    translation: [40, -5, 0] })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [0, 5, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result

  // Test each flip value on mate2
  const flips = ['Z', '-Z', 'X', '-X', 'Y', '-Y']
  const results = {}

  for (let i = 0; i < flips.length; i++) {
    const flip = flips[i]
    const inst = (await api.v1.assembly.instance({
      productId: tpl2, ownerId: asmId, name: `Arrow_${flip}`,
    })).result
    const r = await api.v1.assembly.fastened({
      id: asmId,
      name: `F_${flip}`,
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst], csys: wcs2, flip: flip },
      xOffset: i * 15 - 30,
    })
    results[flip] = { id: r.result, maxLevel: r.maxLevel }
    console.log(`[04] flip=${flip}: result=${r.result} maxLevel=${r.maxLevel}`)
  }

  filewrite(results, 'flip-results')
  await snapshot('all-flips')

  // Test reorient values on mate2
  const reorients = ['0', '90', '180', '270']
  const reorientResults = {}

  for (let i = 0; i < reorients.length; i++) {
    const reorient = reorients[i]
    const inst = (await api.v1.assembly.instance({
      productId: tpl2, ownerId: asmId, name: `Arrow_R${reorient}`,
    })).result
    const r = await api.v1.assembly.fastened({
      id: asmId,
      name: `F_R${reorient}`,
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst], csys: wcs2, reorient: reorient },
      yOffset: 30 + i * 15,
    })
    reorientResults[reorient] = { id: r.result, maxLevel: r.maxLevel }
    console.log(`[04] reorient=${reorient}: result=${r.result} maxLevel=${r.maxLevel}`)
  }

  filewrite(reorientResults, 'reorient-results')
  await snapshot('all-reorients')

  return { asmId }
}
