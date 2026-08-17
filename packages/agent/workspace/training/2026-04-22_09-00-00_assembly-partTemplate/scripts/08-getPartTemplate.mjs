export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const t1 = (await api.v1.assembly.partTemplate({ name: 'Bolt' })).result
  const t2 = (await api.v1.assembly.partTemplate({ name: 'Nut' })).result
  const t3 = (await api.v1.assembly.partTemplate({ name: 'Washer' })).result
  console.log('[08] created: Bolt=', t1, 'Nut=', t2, 'Washer=', t3)

  // Get by name
  const byName = await api.v1.assembly.getPartTemplate({ name: 'Nut' })
  console.log('[08] getPartTemplate(Nut):', byName.result, 'maxLevel:', byName.maxLevel)

  // Get all (no name)
  const all = await api.v1.assembly.getPartTemplate()
  console.log('[08] getPartTemplate() all:', JSON.stringify(all.result))

  // Get all with empty object
  const allObj = await api.v1.assembly.getPartTemplate({})
  console.log('[08] getPartTemplate({}) all:', JSON.stringify(allObj.result))

  // Get non-existent
  const missing = await api.v1.assembly.getPartTemplate({ name: 'NonExistent' })
  console.log('[08] getPartTemplate(NonExistent):', missing.result, 'maxLevel:', missing.maxLevel)
  console.log('[08] missing messages:', JSON.stringify(missing.messages))

  filewrite({ byName: byName.result, all: all.result, missing: { result: missing.result, messages: missing.messages } }, 'getPartTemplate-results')

  return { asmId }
}
