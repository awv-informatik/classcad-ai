// Test: rename CSys
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const csId = (await api.v1.part.workCSys({ id: partId, name: 'OrigCS' })).result

  await api.v1.part.openFeature({ id: csId })
  const r = await api.v1.part.updateWorkCSys({ id: csId, name: 'NewCS' })
  console.log('[03] rename result:', r.result, 'maxLevel:', r.maxLevel)
  await api.v1.part.closeFeature({ id: csId })

  const oldFind = await api.v1.part.getWorkGeometry({ id: partId, name: 'OrigCS' })
  const newFind = await api.v1.part.getWorkGeometry({ id: partId, name: 'NewCS' })
  console.log('[03] find OrigCS:', oldFind.result, 'find NewCS:', newFind.result)

  filewrite({
    rename: { result: r.result, maxLevel: r.maxLevel },
    oldFind: oldFind.result, newFind: newFind.result
  }, 'rename')
  return { partId }
}
