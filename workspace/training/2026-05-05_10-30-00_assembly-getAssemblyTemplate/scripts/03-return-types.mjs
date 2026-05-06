export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Zero templates
  const r0 = await api.v1.assembly.getAssemblyTemplate()
  console.log('[03] 0 templates:', r0.result, 'isArray:', Array.isArray(r0.result))

  // One template
  const t1 = (await api.v1.assembly.assemblyTemplate({ name: 'Only' })).result
  const r1list = await api.v1.assembly.getAssemblyTemplate()
  const r1name = await api.v1.assembly.getAssemblyTemplate({ name: 'Only' })
  console.log('[03] 1 template list:', r1list.result, 'isArray:', Array.isArray(r1list.result))
  console.log('[03] 1 template name:', r1name.result, 'type:', typeof r1name.result, 'isArray:', Array.isArray(r1name.result))

  // Two templates
  const t2 = (await api.v1.assembly.assemblyTemplate({ name: 'Second' })).result
  const r2list = await api.v1.assembly.getAssemblyTemplate()
  console.log('[03] 2 templates list:', r2list.result, 'isArray:', Array.isArray(r2list.result))

  filewrite({
    zeroTemplates: { result: r0.result, isArray: Array.isArray(r0.result), length: Array.isArray(r0.result) ? r0.result.length : null },
    oneTemplateList: { result: r1list.result, isArray: Array.isArray(r1list.result), length: r1list.result?.length },
    oneTemplateName: { result: r1name.result, type: typeof r1name.result, isArray: Array.isArray(r1name.result) },
    twoTemplatesList: { result: r2list.result, isArray: Array.isArray(r2list.result), length: r2list.result?.length },
  }, 'return-types')

  return { asmId, t1, t2 }
}
