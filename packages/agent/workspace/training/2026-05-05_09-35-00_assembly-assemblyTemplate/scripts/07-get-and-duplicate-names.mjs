export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create multiple assembly templates, including duplicates
  const sub1 = (await api.v1.assembly.assemblyTemplate({ name: 'Module' })).result
  const sub2 = (await api.v1.assembly.assemblyTemplate({ name: 'Module' })).result
  const sub3 = (await api.v1.assembly.assemblyTemplate({ name: 'Frame' })).result

  console.log('[07] templates:', sub1, sub2, sub3)

  // getAssemblyTemplate — get all
  const all = (await api.v1.assembly.getAssemblyTemplate({})).result
  console.log('[07] all assembly templates:', JSON.stringify(all))

  // getAssemblyTemplate — by name (duplicate name)
  const byName = (await api.v1.assembly.getAssemblyTemplate({ name: 'Module' })).result
  console.log('[07] getAssemblyTemplate by name "Module":', JSON.stringify(byName))

  // getAssemblyTemplate — by unique name
  const byFrame = (await api.v1.assembly.getAssemblyTemplate({ name: 'Frame' })).result
  console.log('[07] getAssemblyTemplate by name "Frame":', JSON.stringify(byFrame))

  // getAssemblyTemplate — non-existent name
  const notFound = await api.v1.assembly.getAssemblyTemplate({ name: 'NonExistent' })
  console.log('[07] non-existent name result:', notFound.result, 'maxLevel:', notFound.maxLevel)
  console.log('[07] non-existent messages:', JSON.stringify(notFound.messages))

  filewrite({ all, byName, byFrame, notFound: { result: notFound.result, maxLevel: notFound.maxLevel, messages: notFound.messages } }, 'get-template-results')

  return { all, byName, byFrame }
}
