// Test: setFacetingParameters with both params, then read back
export default async function (api, { filewrite }) {
  // Read defaults first
  const before = (await api.v1.common.getFacetingParameters()).result
  console.log('[02] before:', JSON.stringify(before))

  // Set both params
  const setR = await api.v1.common.setFacetingParameters({ angleTol: 15, chordHeightTol: 0.5 })
  console.log('[02] set result:', setR.result)
  console.log('[02] set maxLevel:', setR.maxLevel)
  console.log('[02] set messages:', JSON.stringify(setR.messages))

  // Read back
  const after = (await api.v1.common.getFacetingParameters()).result
  console.log('[02] after:', JSON.stringify(after))

  filewrite({ before, setResult: setR.result, setMaxLevel: setR.maxLevel, setMessages: setR.messages, after }, 'set-both')
  return after
}
