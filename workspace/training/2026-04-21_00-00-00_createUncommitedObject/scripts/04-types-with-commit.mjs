export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TypesCommit' })).result

  const types = [
    'CC_Box',
    'CC_Cylinder',
    'CC_Sphere',
    'CC_Cone',
    'CC_Extrusion',
    'CC_Revolve',
    'CC_Boolean',
    'CC_Fillet',
    'CC_Chamfer',
    'CC_Sketch',
    'CC_WorkPlane',
    'CC_WorkAxis',
    'CC_WorkPoint',
    'CC_WorkCSys',
    'CC_Mirror',
    'CC_LinearPattern',
    'CC_CircularPattern',
    'CC_Translation',
    'CC_Rotation',
    'CC_EntityInjection',
    'CC_Slice',
    'CC_Twist',
    'CC_SliceBySheet',
    'CC_EntityDeletion',
    'CC_ImportFeature',
    'CC_CompositeCurve',
    'CC_TransformationByCSys',
    'CC_Expression',
  ]

  const results = {}
  for (const t of types) {
    // Create new part each time to start fresh
    const pid = (await api.v1.part.create({ name: 'Test_' + t })).result
    const r = await api.v1.part.createUncommitedObject({ id: pid, type: t, name: t.replace('CC_', '') })
    const success = r.maxLevel <= 31
    results[t] = {
      success,
      result: r.result,
      maxLevel: r.maxLevel,
      message: r.messages?.[0]?.message || null,
    }
    console.log(`[04] ${t}: ${success ? 'OK id=' + r.result : 'FAIL'} ${r.messages?.[0]?.message || ''}`)
  }

  filewrite(results, 'all-types')
  return { partId }
}
