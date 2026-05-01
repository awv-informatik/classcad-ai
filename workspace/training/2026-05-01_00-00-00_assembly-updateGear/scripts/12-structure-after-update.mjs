export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GearAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'W1' })).result
  await api.v1.part.cylinder({ id: tpl1, name: 'C', height: 10, diameter: 40 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'W2' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'C', height: 10, diameter: 20 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'W3' })).result
  await api.v1.part.cylinder({ id: tpl3, name: 'C', height: 10, diameter: 30 })
  const wcs3 = (await api.v1.part.workCSys({ id: tpl3, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2', transformation: [[30,0,0],[1,0,0],[0,1,0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'I3', transformation: [[-35,0,0],[1,0,0],[0,1,0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })
  const rev1 = (await api.v1.assembly.revolute({ id: asmId, name: 'R1', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst2], csys: wcs2 } })).result
  const rev2 = (await api.v1.assembly.revolute({ id: asmId, name: 'R2', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst3], csys: wcs3 } })).result

  // Create with degree expression for offset
  const gearId = (await api.v1.assembly.gear({ id: asmId, name: 'G1', constr1Id: rev1, constr2Id: rev2, ratio: 2, offset: '45deg' })).result

  // Get structure before update
  const r1 = await api.v1.assembly.getGear({ id: asmId, name: 'G1' })

  // Update to new ratio and radian offset
  await api.v1.assembly.updateGear({ id: gearId, ratio: 3.5, offset: 1.0472 })

  // Get structure after update
  const r2 = await api.v1.assembly.getGear({ id: asmId, name: 'G1' })

  // Update with degree expression again
  await api.v1.assembly.updateGear({ id: gearId, offset: '180deg' })
  const r3 = await api.v1.assembly.getGear({ id: asmId, name: 'G1' })

  console.log('[12] before — ratio:', r1.result.ratio, 'offset:', r1.result.offset)
  console.log('[12] after radian update — ratio:', r2.result.ratio, 'offset:', r2.result.offset)
  console.log('[12] after deg update — ratio:', r3.result.ratio, 'offset:', r3.result.offset, '(expected ~3.14159)')

  // Check structure tree to see how offset is stored internally
  const structR = await api.v1.assembly.updateGear({ id: gearId, offset: '60deg' })
  filewrite(structR.structure, 'structure-after-update')

  // Find the gear relation node in the structure tree
  function findNode(node, targetId) {
    if (!node) return null
    if (node.id === targetId) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, targetId)
        if (found) return found
      }
    }
    return null
  }

  if (structR.structure) {
    const gearNode = findNode(structR.structure, gearId)
    if (gearNode) {
      console.log('[12] gear node type:', gearNode.typeName)
      console.log('[12] gear node name:', gearNode.name)
      const params = gearNode.children?.filter(c => c.typeName?.includes('Param') || c.typeName?.includes('Expression'))
      if (params?.length) {
        for (const p of params) {
          console.log('[12] param:', p.name, '=', p.value, 'type:', p.typeName)
        }
      }
    } else {
      console.log('[12] gear node not found in structure')
    }
  }

  return { gearId }
}
