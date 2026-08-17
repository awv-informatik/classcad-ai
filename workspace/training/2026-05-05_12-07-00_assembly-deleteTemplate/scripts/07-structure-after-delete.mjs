export default async function (api, { snapshot, filewrite }) {
  // Verify the structure tree state before and after template deletion
  const asmId = (await api.v1.assembly.create({ name: 'StructTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box1', length: 40, width: 30, height: 20 })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Part2' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box2', length: 20, width: 50, height: 30 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instances of both
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId,
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Get structure before
  const structBefore = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' }))
  // Just capture the structure from a recalc call
  const recBefore = await api.v1.common.recalc({})
  filewrite(recBefore.structure, 'structure-before')

  await snapshot('before-delete')

  // Delete tpl1 (which has inst1)
  await api.v1.assembly.deleteTemplate({ ids: [tpl1] })

  const recAfter = await api.v1.common.recalc({})
  filewrite(recAfter.structure, 'structure-after')

  await snapshot('after-delete')

  // Verify what's left
  const tpls = await api.v1.assembly.getPartTemplate({})
  const insts = await api.v1.assembly.getInstance({ ownerId: asmId })
  console.log('[07] remaining templates:', JSON.stringify(tpls.result))
  console.log('[07] remaining instances:', JSON.stringify(insts.result))

  return { asmId, tpl1, tpl2, inst1, inst2 }
}
