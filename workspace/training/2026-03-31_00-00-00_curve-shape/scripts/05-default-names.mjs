// 05 — Default names: what do shapes without explicit names get called?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const s1 = (await api.v1.curve.shape({ id: eifId })).result
  const s2 = (await api.v1.curve.shape({ id: eifId })).result
  const s3 = (await api.v1.curve.shape({ id: eifId })).result

  // Get final structure after all 3 shapes
  const r = await api.v1.common.getAppVersion({})
  const tree = r.structure.tree
  const names = [s1, s2, s3].map(id => ({
    id,
    name: tree[String(id)]?.name,
    class: tree[String(id)]?.class
  }))
  console.log('[05] default names:', JSON.stringify(names))
  filewrite(names, 'default-names')

  return {}
}
