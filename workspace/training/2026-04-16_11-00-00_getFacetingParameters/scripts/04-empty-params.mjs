// Test: setFacetingParameters with empty object — is it a no-op?
export default async function (api, { filewrite }) {
  // Set known state
  await api.v1.common.setFacetingParameters({ angleTol: 10, chordHeightTol: 0.3 })
  const before = (await api.v1.common.getFacetingParameters()).result
  console.log('[04] before:', JSON.stringify(before))

  // Empty params
  const emptyR = await api.v1.common.setFacetingParameters({})
  console.log('[04] empty set result:', emptyR.result)
  console.log('[04] empty set maxLevel:', emptyR.maxLevel)

  const after = (await api.v1.common.getFacetingParameters()).result
  console.log('[04] after empty set:', JSON.stringify(after))
  console.log('[04] unchanged?', JSON.stringify(before) === JSON.stringify(after))

  filewrite({ before, emptyResult: emptyR.result, emptyMaxLevel: emptyR.maxLevel, after }, 'empty-params')
  return { before, after }
}
