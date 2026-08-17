// 02 — Duplicate shape names: does auto-suffixing work?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create 3 shapes with the same name
  const s1 = await api.v1.curve.shape({ id: eifId, name: 'Foo' })
  const s2 = await api.v1.curve.shape({ id: eifId, name: 'Foo' })
  const s3 = await api.v1.curve.shape({ id: eifId, name: 'Foo' })

  console.log('[02] s1:', s1.result, 's2:', s2.result, 's3:', s3.result)

  // Also create shapes with default name (no name param)
  const d1 = await api.v1.curve.shape({ id: eifId })
  const d2 = await api.v1.curve.shape({ id: eifId })

  console.log('[02] d1:', d1.result, 'd2:', d2.result)

  // Check names in structure
  const tree = s3.structure.tree
  const ids = [s1.result, s2.result, s3.result, d1.result, d2.result]
  const names = ids.map(id => {
    const node = tree[String(id)]
    return { id, name: node?.name, class: node?.class }
  })
  console.log('[02] names:', JSON.stringify(names))
  filewrite(names, 'shape-names')

  return { ids }
}
