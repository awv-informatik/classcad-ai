export default async function (api, { filewrite }) {
  // Create assembly but no part templates
  const asmId = (await api.v1.assembly.create({ name: 'EmptyAsm' })).result
  console.log('[07] assembly created:', asmId)

  // List all — should be empty
  const rAll = await api.v1.assembly.getPartTemplate()
  console.log('[07] no templates getPartTemplate():', JSON.stringify(rAll.result), 'maxLevel:', rAll.maxLevel)

  // Name lookup — should fail
  const rName = await api.v1.assembly.getPartTemplate({ name: 'Ghost' })
  console.log('[07] no templates getPartTemplate({name}):', rName.result, 'maxLevel:', rName.maxLevel)

  filewrite({
    allEmpty: { result: rAll.result, maxLevel: rAll.maxLevel, messages: rAll.messages },
    nameLookup: { result: rName.result, maxLevel: rName.maxLevel, messages: rName.messages },
  }, 'no-templates')

  return { asmId }
}
