export default async function (api, { filewrite }) {
  // First create a part
  const partR = await api.v1.part.create({ name: 'TestPart' })
  console.log('[05] part.create result:', partR.result)

  // Now try assembly.create — capture full error details
  const asmR = await api.v1.assembly.create({ name: 'AfterPart' })
  console.log('[05] assembly.create result:', asmR.result, 'maxLevel:', asmR.maxLevel)
  console.log('[05] messages:', JSON.stringify(asmR.messages, null, 2))

  filewrite({ result: asmR.result, messages: asmR.messages, maxLevel: asmR.maxLevel }, 'error-after-part')
  return { asmId: asmR.result }
}
