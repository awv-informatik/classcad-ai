export default async function (api, { snapshot, filewrite }) {
  // Create an assembly
  const asmId = (await api.v1.assembly.create({})).result
  console.log('[19] asmId:', asmId)

  // Create an uncommitted object in the assembly
  const r1 = await api.v1.assembly.createUncommitedObject({ id: asmId, type: 'CC_FastenedConstraint', name: 'TestFastened' })
  console.log('[19] assembly.createUncommitedObject:', r1.result, 'maxLevel:', r1.maxLevel, 'msg:', r1.messages?.[0]?.message || 'none')
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'asm-uncommitted')

  // Try other assembly types
  if (r1.result) {
    // Check the structure
    const recR = await api.v1.common.recalc({})
    const tree = recR.structure?.tree
    const node = tree?.[r1.result]
    if (node) {
      console.log('[19] node class:', node.class, 'members:', Object.keys(node.members))
      filewrite(node, 'fastened-node')
    }

    // Commit it
    await api.v1.part.openFeature({ id: r1.result })
    await api.v1.part.closeFeature({ id: r1.result })
    console.log('[19] committed fastened')
  }

  // Test other assembly object types
  const asmTypes = ['CC_FastenedOriginConstraint', 'CC_RevoluteConstraint', 'CC_PrismaticConstraint',
    'CC_CylindricalConstraint', 'CC_PlanarConstraint', 'CC_BallConstraint']
  for (const t of asmTypes) {
    const r = await api.v1.assembly.createUncommitedObject({ id: asmId, type: t, name: t.replace('CC_', '') })
    console.log(`[19] ${t}: result=${r.result} maxLevel=${r.maxLevel}`)
    if (r.result) {
      await api.v1.part.openFeature({ id: r.result })
      await api.v1.part.closeFeature({ id: r.result })
    }
  }

  return { asmId }
}
