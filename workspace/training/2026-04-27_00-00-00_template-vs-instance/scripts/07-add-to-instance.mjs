export default async function (api, { snapshot, filewrite }) {
  // The API docs say: "If the owner is an instance in the expanded tree, its template
  // in the assembly container will also be updated."
  // Test: add a new sub-instance to an existing assembly instance

  const asmId = (await api.v1.assembly.create({ name: 'AddToInstanceTest' })).result

  const partTpl = (await api.v1.assembly.partTemplate({ name: 'Widget' })).result
  await api.v1.part.box({ id: partTpl, name: 'WidgetBox', length: 20, width: 20, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: partTpl, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Create sub-assembly template with one widget
  const subTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  await api.v1.assembly.setCurrentProduct({ id: subTpl })
  const w1 = (await api.v1.assembly.instance({ productId: partTpl, ownerId: subTpl, name: 'Widget1' })).result
  console.log('[07] subTpl:', subTpl, 'w1:', w1)

  // Switch back and create TWO instances of the sub-assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const sub1 = (await api.v1.assembly.instance({ productId: subTpl, ownerId: asmId, name: 'Sub1' })).result
  const sub2 = (await api.v1.assembly.instance({ productId: subTpl, ownerId: asmId, name: 'Sub2',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[07] sub1:', sub1, 'sub2:', sub2)

  // Check children before
  const childrenBefore1 = await api.v1.assembly.getInstance({ ownerId: sub1 })
  const childrenBefore2 = await api.v1.assembly.getInstance({ ownerId: sub2 })
  console.log('[07] sub1 children before:', childrenBefore1.result)
  console.log('[07] sub2 children before:', childrenBefore2.result)

  await snapshot('before-add')

  // NOW: add a new widget instance to sub1 (an instance, not the template)
  const w2 = (await api.v1.assembly.instance({
    productId: partTpl, ownerId: sub1, name: 'Widget2',
    transformation: [[30, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[07] added Widget2 to sub1:', w2)

  // Check children after — does sub2 also get Widget2?
  const childrenAfter1 = await api.v1.assembly.getInstance({ ownerId: sub1 })
  const childrenAfter2 = await api.v1.assembly.getInstance({ ownerId: sub2 })
  console.log('[07] sub1 children after:', childrenAfter1.result)
  console.log('[07] sub2 children after:', childrenAfter2.result)

  // Check template too
  const tplChildren = await api.v1.assembly.getInstance({ ownerId: subTpl })
  console.log('[07] subTpl children after:', tplChildren.result)

  await snapshot('after-add')
  return { asmId, subTpl, sub1, sub2 }
}
