export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  // Create templates with duplicate names — assemblyTemplate auto-deduplicates
  const d1 = (await api.v1.assembly.assemblyTemplate({ name: 'Motor' })).result
  const d2 = (await api.v1.assembly.assemblyTemplate({ name: 'Motor' })).result
  const d3 = (await api.v1.assembly.assemblyTemplate({ name: 'Motor' })).result
  console.log('[05] Motor duplicates:', d1, d2, d3)

  // List all
  const listAll = await api.v1.assembly.getAssemblyTemplate()
  console.log('[05] listAll:', JSON.stringify(listAll.result))

  // Find by original name "Motor" — which one does it return?
  const findMotor = await api.v1.assembly.getAssemblyTemplate({ name: 'Motor' })
  console.log('[05] findMotor:', findMotor.result, '(expect', d1, ')')

  // Find deduped names
  const findMotor0 = await api.v1.assembly.getAssemblyTemplate({ name: 'Motor0' })
  console.log('[05] findMotor0:', findMotor0.result, '(expect', d2, ')')

  const findMotor1 = await api.v1.assembly.getAssemblyTemplate({ name: 'Motor1' })
  console.log('[05] findMotor1:', findMotor1.result, '(expect', d3, ')')

  filewrite({
    ids: { d1, d2, d3 },
    listAll: listAll.result,
    findMotor: findMotor.result,
    findMotor0: findMotor0.result,
    findMotor1: findMotor1.result,
  }, 'duplicates')

  return { asmId }
}
