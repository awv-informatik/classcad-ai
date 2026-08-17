export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with one part template and two instances
  const asmId = (await api.v1.assembly.create({ name: 'PropagationTest' })).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'EditablePart' })).result
  const boxId = (await api.v1.part.box({ id: tpl, name: 'Box1', length: 60, width: 40, height: 30 })).result
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  console.log('[02] tpl:', tpl, 'boxId:', boxId, 'wcs:', wcs)

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[02] inst1:', inst1, 'inst2:', inst2)

  // BEFORE: snapshot and capture graphic/structure
  await snapshot('before-edit')
  const r1 = await api.v1.common.getAppVersion({})
  filewrite(r1.structure, 'structure-before')

  // Now modify the template — add a cylinder on top of the box
  await api.v1.assembly.setCurrentProduct({ id: tpl })
  const cylId = (await api.v1.part.cylinder({ id: tpl, name: 'Cyl1', height: 40, diameter: 20,
    translation: [30, 20, 30],
  })).result
  console.log('[02] added cylinder:', cylId, 'to template')

  // Switch back to assembly context
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // AFTER: snapshot and capture graphic/structure
  await snapshot('after-edit')
  const r2 = await api.v1.common.getAppVersion({})
  filewrite(r2.structure, 'structure-after')

  // Check if instances see the new cylinder
  // Compare instance node structure before/after
  const instBefore = r1.structure.tree['186'] || r1.structure.tree[inst1]
  const instAfter = r2.structure.tree['186'] || r2.structure.tree[inst1]
  console.log('[02] instance before:', JSON.stringify(instBefore?.members?.productId))
  console.log('[02] instance after:', JSON.stringify(instAfter?.members?.productId))

  return { asmId, tpl, inst1, inst2 }
}
