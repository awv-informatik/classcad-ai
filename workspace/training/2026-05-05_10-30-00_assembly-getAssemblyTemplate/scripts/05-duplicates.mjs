export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create 3 templates with same name — should auto-deduplicate
  const t1 = (await api.v1.assembly.assemblyTemplate({ name: 'Motor' })).result
  const t2 = (await api.v1.assembly.assemblyTemplate({ name: 'Motor' })).result
  const t3 = (await api.v1.assembly.assemblyTemplate({ name: 'Motor' })).result
  console.log('[05] created:', t1, t2, t3)

  // List all
  const all = await api.v1.assembly.getAssemblyTemplate()
  console.log('[05] all:', all.result)

  // Try finding by original name and deduped names
  const rMotor = await api.v1.assembly.getAssemblyTemplate({ name: 'Motor' })
  const rMotor0 = await api.v1.assembly.getAssemblyTemplate({ name: 'Motor0' })
  const rMotor1 = await api.v1.assembly.getAssemblyTemplate({ name: 'Motor1' })

  console.log('[05] Motor:', rMotor.result, '(expect', t1, ')')
  console.log('[05] Motor0:', rMotor0.result, '(expect', t2, ')')
  console.log('[05] Motor1:', rMotor1.result, '(expect', t3, ')')

  filewrite({
    ids: { t1, t2, t3 },
    all: all.result,
    lookupMotor: { result: rMotor.result, maxLevel: rMotor.maxLevel },
    lookupMotor0: { result: rMotor0.result, maxLevel: rMotor0.maxLevel },
    lookupMotor1: { result: rMotor1.result, maxLevel: rMotor1.maxLevel },
    correctMapping: rMotor.result === t1 && rMotor0.result === t2 && rMotor1.result === t3,
  }, 'duplicate-results')

  return { asmId }
}
