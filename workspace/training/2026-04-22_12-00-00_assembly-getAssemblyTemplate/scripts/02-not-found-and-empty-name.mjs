export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tpl1 = (await api.v1.assembly.assemblyTemplate({ name: 'Exists' })).result
  console.log('[02] created template:', tpl1)

  // Not found — nonexistent name
  const notFound = await api.v1.assembly.getAssemblyTemplate({ name: 'DoesNotExist' })
  console.log('[02] notFound result:', notFound.result)
  console.log('[02] notFound maxLevel:', notFound.maxLevel)
  console.log('[02] notFound messages:', JSON.stringify(notFound.messages))

  // Empty string name lookup — reported to fail
  const emptyName = await api.v1.assembly.getAssemblyTemplate({ name: '' })
  console.log('[02] emptyName result:', emptyName.result)
  console.log('[02] emptyName maxLevel:', emptyName.maxLevel)
  console.log('[02] emptyName messages:', JSON.stringify(emptyName.messages))

  // Create a template with empty name and try again
  const emptyTpl = (await api.v1.assembly.assemblyTemplate({ name: '' })).result
  console.log('[02] created empty-name template:', emptyTpl)

  const emptyNameRetry = await api.v1.assembly.getAssemblyTemplate({ name: '' })
  console.log('[02] emptyNameRetry result:', emptyNameRetry.result)
  console.log('[02] emptyNameRetry maxLevel:', emptyNameRetry.maxLevel)
  console.log('[02] emptyNameRetry messages:', JSON.stringify(emptyNameRetry.messages))

  // Case sensitivity — try lowercase
  const caseMismatch = await api.v1.assembly.getAssemblyTemplate({ name: 'exists' })
  console.log('[02] caseMismatch result:', caseMismatch.result)
  console.log('[02] caseMismatch maxLevel:', caseMismatch.maxLevel)

  filewrite({
    notFound: { result: notFound.result, maxLevel: notFound.maxLevel, messages: notFound.messages },
    emptyName: { result: emptyName.result, maxLevel: emptyName.maxLevel, messages: emptyName.messages },
    emptyNameRetry: { result: emptyNameRetry.result, maxLevel: emptyNameRetry.maxLevel, messages: emptyNameRetry.messages },
    caseMismatch: { result: caseMismatch.result, maxLevel: caseMismatch.maxLevel, messages: caseMismatch.messages },
  }, 'edge-cases')

  return { asmId }
}
