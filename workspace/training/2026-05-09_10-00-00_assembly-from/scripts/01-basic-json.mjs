// Test: what does assembly.from accept as JSON format?
// Strategy: build an assembly manually, then try to discover the JSON schema
// by trying various JSON structures
export default async function (api, { snapshot, filewrite }) {
  // First, try the simplest possible JSON — an empty object
  console.log('[01] Testing assembly.from with minimal JSON data...')

  // Test 1: empty JSON string
  const r1 = await api.v1.assembly.from({ data: '{}', format: 'JSON' })
  console.log('[01] empty JSON:', 'result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'empty-json')

  // Test 2: Try a simple structure with a name
  const r2 = await api.v1.assembly.from({ data: JSON.stringify({ name: 'TestAsm' }), format: 'JSON' })
  console.log('[01] named JSON:', 'result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'named-json')

  // Test 3: Try an array
  const r3 = await api.v1.assembly.from({ data: '[]', format: 'JSON' })
  console.log('[01] array JSON:', 'result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'array-json')

  // Test 4: Try with assembly-like structure
  const r4 = await api.v1.assembly.from({
    data: JSON.stringify({
      type: 'assembly',
      name: 'TestAsm',
      parts: [],
    }),
    format: 'JSON',
  })
  console.log('[01] assembly-like JSON:', 'result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'assembly-like-json')

  return { r1: r1.result, r2: r2.result, r3: r3.result, r4: r4.result }
}
