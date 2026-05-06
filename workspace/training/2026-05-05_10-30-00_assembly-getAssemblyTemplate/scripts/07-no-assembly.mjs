export default async function (api, { filewrite }) {
  // Do NOT call assembly.create — test without any assembly context
  const rList = await api.v1.assembly.getAssemblyTemplate()
  const rName = await api.v1.assembly.getAssemblyTemplate({ name: 'Foo' })

  console.log('[07] list without assembly:', rList.result, 'maxLevel:', rList.maxLevel)
  console.log('[07] name without assembly:', rName.result, 'maxLevel:', rName.maxLevel)

  filewrite({
    listAll: { result: rList.result, maxLevel: rList.maxLevel, isArray: Array.isArray(rList.result), messages: rList.messages },
    byName: { result: rName.result, maxLevel: rName.maxLevel, messages: rName.messages },
  }, 'no-assembly')

  return {}
}
