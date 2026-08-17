export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TypeTest' })).result

  // Try creating different CC_ types as uncommitted objects
  const types = [
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
  ]

  const results = {}
  for (const t of types) {
    try {
      const r = await api.v1.part.createUncommitedObject({ id: partId, type: t, name: t.replace('CC_', '') })
      results[t] = { result: r.result, maxLevel: r.maxLevel, messages: r.messages }
      console.log(`[03] ${t}: id=${r.result} maxLevel=${r.maxLevel}`)
    } catch (e) {
      results[t] = { error: e.message }
      console.log(`[03] ${t}: ERROR ${e.message}`)
    }
  }

  filewrite(results, 'type-results')
  return { partId }
}
