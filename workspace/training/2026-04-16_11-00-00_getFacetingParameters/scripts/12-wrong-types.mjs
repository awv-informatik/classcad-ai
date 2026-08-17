// Test: passing wrong types to setFacetingParameters
export default async function (api, { filewrite }) {
  // Reset
  await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0.1 })
  const baseline = (await api.v1.common.getFacetingParameters()).result
  console.log('[12] baseline:', JSON.stringify(baseline))

  // String value
  const strR = await api.v1.common.setFacetingParameters({ chordHeightTol: 'abc' })
  console.log('[12] string chordHeightTol maxLevel:', strR.maxLevel)
  console.log('[12] string chordHeightTol messages:', JSON.stringify(strR.messages))
  const afterStr = (await api.v1.common.getFacetingParameters()).result
  console.log('[12] after string:', JSON.stringify(afterStr))

  // Boolean value
  const boolR = await api.v1.common.setFacetingParameters({ angleTol: true })
  console.log('[12] boolean angleTol maxLevel:', boolR.maxLevel)
  console.log('[12] boolean angleTol messages:', JSON.stringify(boolR.messages))
  const afterBool = (await api.v1.common.getFacetingParameters()).result
  console.log('[12] after boolean:', JSON.stringify(afterBool))

  // Unknown param
  const unknownR = await api.v1.common.setFacetingParameters({ foo: 42 })
  console.log('[12] unknown param maxLevel:', unknownR.maxLevel)
  const afterUnknown = (await api.v1.common.getFacetingParameters()).result
  console.log('[12] after unknown:', JSON.stringify(afterUnknown))

  filewrite({
    baseline,
    strResult: { maxLevel: strR.maxLevel, messages: strR.messages },
    afterStr,
    boolResult: { maxLevel: boolR.maxLevel, messages: boolR.messages },
    afterBool,
    unknownResult: { maxLevel: unknownR.maxLevel },
    afterUnknown,
  }, 'wrong-types')
  return { afterStr, afterBool, afterUnknown }
}
