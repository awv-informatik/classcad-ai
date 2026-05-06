export default async function (api, { filewrite }) {
  // No assembly.create — just raw getPartTemplate calls
  const rAll = await api.v1.assembly.getPartTemplate()
  const rByName = await api.v1.assembly.getPartTemplate({ name: 'Anything' })

  console.log('[07] no assembly - list:', JSON.stringify(rAll.result), 'maxLevel:', rAll.maxLevel, 'isArray:', Array.isArray(rAll.result))
  console.log('[07] no assembly - name:', rByName.result, 'maxLevel:', rByName.maxLevel)

  filewrite({
    listAll: { result: rAll.result, maxLevel: rAll.maxLevel, isArray: Array.isArray(rAll.result), messages: rAll.messages },
    byName: { result: rByName.result, maxLevel: rByName.maxLevel, messages: rByName.messages },
  }, 'no-assembly')

  return {}
}
