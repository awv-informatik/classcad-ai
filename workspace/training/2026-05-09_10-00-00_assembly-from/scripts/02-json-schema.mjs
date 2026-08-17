// Test: JSON schema based on error clues — templates/instances/constraints arrays
export default async function (api, { snapshot, filewrite }) {
  console.log('[02] Testing JSON with templates/instances/constraints arrays...')

  // Test 1: Empty arrays — should be valid structure
  const json1 = { templates: [], instances: [], constraints: [] }
  const r1 = await api.v1.assembly.from({ data: JSON.stringify(json1), format: 'JSON' })
  console.log('[02] empty arrays:', 'result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'empty-arrays')

  // Test 2: With a minimal template
  const json2 = {
    templates: [{ name: 'Box1' }],
    instances: [],
    constraints: [],
  }
  const r2 = await api.v1.assembly.from({ data: JSON.stringify(json2), format: 'JSON' })
  console.log('[02] one template:', 'result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'one-template')

  // Test 3: Template with type specification
  const json3 = {
    templates: [{ name: 'Box1', type: 'part' }],
    instances: [],
    constraints: [],
  }
  const r3 = await api.v1.assembly.from({ data: JSON.stringify(json3), format: 'JSON' })
  console.log('[02] typed template:', 'result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'typed-template')

  // Test 4: Template with geometry? data? ofb?
  const json4 = {
    templates: [{ name: 'Box1', type: 'part', data: '' }],
    instances: [],
    constraints: [],
  }
  const r4 = await api.v1.assembly.from({ data: JSON.stringify(json4), format: 'JSON' })
  console.log('[02] template with data:', 'result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'template-with-data')

  return { r1: r1.result, r2: r2.result, r3: r3.result, r4: r4.result }
}
