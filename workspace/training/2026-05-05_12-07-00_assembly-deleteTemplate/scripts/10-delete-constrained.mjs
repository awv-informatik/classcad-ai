export default async function (api, { snapshot, filewrite }) {
  // Test: delete template that has instances with constraints
  const asmId = (await api.v1.assembly.create({ name: 'ConstrainedDel' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'BaseBox', length: 80, width: 60, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Mate', origin: [40, 30, 10], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Peg' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'PegCyl', height: 30, diameter: 10 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Mate', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'PegInst',
    transformation: [[40, 30, 10], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[10] tpl1:', tpl1, 'tpl2:', tpl2, 'inst1:', inst1, 'inst2:', inst2)
  console.log('[10] wcs1:', wcs1, 'wcs2:', wcs2)

  // Add a fastened constraint between instances
  const fRes = await api.v1.assembly.fastened({
    id: asmId, name: 'Fix',
    mate1: { path: [inst2], csys: wcs2 },
    mate2: { path: [inst1], csys: wcs1 },
  })
  console.log('[10] fastened result:', fRes.result, 'maxLevel:', fRes.maxLevel)

  await snapshot('before-delete')

  // Delete the peg template — which has an instance that's constrained
  const r = await api.v1.assembly.deleteTemplate({ ids: [tpl2] })
  console.log('[10] delete constrained template - result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] messages:', JSON.stringify(r.messages))

  // Check state
  const tpls = await api.v1.assembly.getPartTemplate({})
  const insts = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[10] remaining templates:', JSON.stringify(tpls.result))
  console.log('[10] remaining instances:', JSON.stringify(insts.result))

  await snapshot('after-delete')

  filewrite({
    deleteResult: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    remainingTemplates: tpls.result,
    remainingInstances: insts.result,
  }, 'constrained-delete')

  return { asmId, tpl1, tpl2, inst1, inst2 }
}
