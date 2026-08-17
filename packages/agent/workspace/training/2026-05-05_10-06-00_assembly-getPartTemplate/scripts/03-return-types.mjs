export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Test' })).result

  // Single template
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Only' })).result

  const rList1 = await api.v1.assembly.getPartTemplate()
  const rName1 = await api.v1.assembly.getPartTemplate({ name: 'Only' })

  console.log('[03] 1 template - list:', JSON.stringify(rList1.result), 'isArray:', Array.isArray(rList1.result))
  console.log('[03] 1 template - name:', rName1.result, 'type:', typeof rName1.result, 'isArray:', Array.isArray(rName1.result))

  // Two templates
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Another' })).result

  const rList2 = await api.v1.assembly.getPartTemplate()
  const rName2 = await api.v1.assembly.getPartTemplate({ name: 'Another' })

  console.log('[03] 2 templates - list:', JSON.stringify(rList2.result), 'isArray:', Array.isArray(rList2.result))
  console.log('[03] 2 templates - name:', rName2.result, 'type:', typeof rName2.result)

  filewrite({
    single: {
      list: { result: rList1.result, isArray: Array.isArray(rList1.result), length: rList1.result?.length },
      name: { result: rName1.result, type: typeof rName1.result, isArray: Array.isArray(rName1.result) },
    },
    double: {
      list: { result: rList2.result, isArray: Array.isArray(rList2.result), length: rList2.result?.length },
      name: { result: rName2.result, type: typeof rName2.result },
    },
  }, 'return-types')

  return { asmId }
}
