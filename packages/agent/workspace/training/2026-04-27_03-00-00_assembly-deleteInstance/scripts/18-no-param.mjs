export default async function (api, { filewrite }) {
  // Edge case: call deleteInstance with no params or missing ids
  const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result

  // No params at all
  const r1 = await api.v1.assembly.deleteInstance({})
  console.log('[18] no params result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'no-params-response')

  // null ids
  try {
    const r2 = await api.v1.assembly.deleteInstance({ ids: null })
    console.log('[18] null ids result:', r2.result, 'maxLevel:', r2.maxLevel)
    filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'null-ids-response')
  } catch (e) {
    console.log('[18] null ids threw:', e.message)
  }

  return { asmId }
}
