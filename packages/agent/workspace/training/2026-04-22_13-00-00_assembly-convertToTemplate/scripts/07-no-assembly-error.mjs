export default async function (api, { filewrite }) {
  // Error case: call convertToTemplate with no assembly in the drawing
  // (drawing is already clear from harness)
  const r = await api.v1.assembly.convertToTemplate({ name: 'ShouldFail' })
  console.log('[07] result:', r.result)
  console.log('[07] maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-assembly-error')

  return {}
}
