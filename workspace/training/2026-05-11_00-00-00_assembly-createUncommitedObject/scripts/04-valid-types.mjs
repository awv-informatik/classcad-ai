export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Test all constraint types
  const types = [
    'CC_FastenedConstraint',
    'CC_FastenedOriginConstraint',
    'CC_RevoluteConstraint',
    'CC_CylindricalConstraint',
    'CC_PlanarConstraint',
    'CC_ParallelConstraint',
    'CC_SliderConstraint',
    'CC_SphericalConstraint',
    'CC_BallConstraint',
    'CC_PrismaticConstraint',
    'CC_GearRelation',
    'CC_GroupConstraint',
    'CC_LinearPatternConstraint',
    'CC_CircularPatternConstraint',
    // Non-constraint types
    'CC_ProductReference',
    'CC_Assembly',
    'CC_Part',
  ]

  const results = {}
  for (const type of types) {
    const r = await api.v1.assembly.createUncommitedObject({
      id: asmId,
      type,
      name: `Test_${type}`,
    })
    results[type] = { result: r.result, maxLevel: r.maxLevel, messages: r.messages }
    console.log(`[04] ${type}: result=${r.result} maxLevel=${r.maxLevel}`)

    // Decline each one to keep things clean
    if (r.result && r.maxLevel < 51) {
      await api.v1.part.openFeature({ id: r.result })
      await api.v1.part.closeFeature({ id: r.result })
    }
  }

  filewrite(results, 'all-types')
  return {}
}
