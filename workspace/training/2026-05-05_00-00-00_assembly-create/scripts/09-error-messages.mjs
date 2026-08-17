export default async function (api, { filewrite }) {
  // Capture the actual error messages when assembly.create fails
  // Test 1: call create when drawing already has an assembly
  const r1 = await api.v1.assembly.create({ name: 'First' })
  console.log('[09] first create:', r1.result, 'maxLevel:', r1.maxLevel)

  // Second create should fail
  const r2 = await api.v1.assembly.create({ name: 'Second' })
  console.log('[09] second create:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[09] second messages:', JSON.stringify(r2.messages))

  filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'double-create-error')

  return { first: r1.result, secondFailed: r2.result === null }
}
