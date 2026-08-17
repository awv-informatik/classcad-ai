export default async function (api, { filewrite }) {
  // Don't create an assembly — call getPartTemplate without init
  const rAll = await api.v1.assembly.getPartTemplate()
  console.log('[06] no assembly getPartTemplate():', rAll.result, 'maxLevel:', rAll.maxLevel)

  const rName = await api.v1.assembly.getPartTemplate({ name: 'Anything' })
  console.log('[06] no assembly getPartTemplate({name}):', rName.result, 'maxLevel:', rName.maxLevel)

  filewrite({
    allNoAsm: { result: rAll.result, maxLevel: rAll.maxLevel, messages: rAll.messages },
    nameNoAsm: { result: rName.result, maxLevel: rName.maxLevel, messages: rName.messages },
  }, 'no-assembly')

  return {}
}
