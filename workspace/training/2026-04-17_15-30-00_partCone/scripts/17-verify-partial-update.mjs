export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeVerify' })).result
  const coneId = (await api.v1.part.cone({
    id: partId, name: 'VerifyCone', bDiameter: 60, tDiameter: 10, height: 80,
  })).result

  function findNode(node, id) {
    if (!node || typeof node !== 'object') return null
    if (node.id === id) return node
    for (const key of Object.keys(node)) {
      const child = node[key]
      if (Array.isArray(child)) {
        for (const item of child) {
          const r = findNode(item, id)
          if (r) return r
        }
      } else if (typeof child === 'object' && child !== null) {
        const r = findNode(child, id)
        if (r) return r
      }
    }
    return null
  }

  // Get structure before update (use the creation response)
  const rCreate = await api.v1.common.recalc({})
  const structBefore = findNode(rCreate.structure, coneId)
  console.log('[17] before bD:', structBefore?.members?.bDiameter?.value,
    'tD:', structBefore?.members?.tDiameter?.value,
    'h:', structBefore?.members?.height?.value)

  // Partial update: only change height
  await api.v1.part.openFeature({ id: coneId })
  await api.v1.part.updateCone({ id: coneId, height: 200 })
  const rClose = await api.v1.part.closeFeature({ id: coneId })

  const structAfter = findNode(rClose.structure, coneId)
  console.log('[17] after bD:', structAfter?.members?.bDiameter?.value,
    'tD:', structAfter?.members?.tDiameter?.value,
    'h:', structAfter?.members?.height?.value)

  filewrite({
    before: {
      bDiameter: structBefore?.members?.bDiameter?.value,
      tDiameter: structBefore?.members?.tDiameter?.value,
      height: structBefore?.members?.height?.value,
    },
    after: {
      bDiameter: structAfter?.members?.bDiameter?.value,
      tDiameter: structAfter?.members?.tDiameter?.value,
      height: structAfter?.members?.height?.value,
    },
  }, 'partial-verify')

  return { partId, coneId }
}
