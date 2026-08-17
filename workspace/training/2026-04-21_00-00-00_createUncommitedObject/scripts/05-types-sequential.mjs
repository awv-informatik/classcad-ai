export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TypeSeq' })).result
  console.log('[05] partId:', partId)

  const types = [
    'CC_Box',
    'CC_Cylinder',
    'CC_Sphere',
    'CC_Cone',
    'CC_Extrusion',
    'CC_Revolve',
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
    'CC_Boolean',
    'CC_SliceBySheet',
    'CC_EntityDeletion',
    'CC_ImportFeature',
    'CC_CompositeCurve',
    'CC_TransformationByCSys',
  ]

  const results = {}
  for (const t of types) {
    const r = await api.v1.part.createUncommitedObject({ id: partId, type: t, name: t.replace('CC_', '') })
    const success = r.maxLevel <= 31
    results[t] = {
      success,
      result: r.result,
      maxLevel: r.maxLevel,
      message: r.messages?.[0]?.message || null,
    }
    console.log(`[05] ${t}: ${success ? 'OK id=' + r.result : 'FAIL'} ${r.messages?.[0]?.message || ''}`)

    if (success && r.result) {
      // Commit it: open → close (no update needed)
      await api.v1.part.openFeature({ id: r.result })
      await api.v1.part.closeFeature({ id: r.result })
      console.log(`[05]   committed ${t}`)
    }
  }

  filewrite(results, 'sequential-types')
  return { partId }
}
