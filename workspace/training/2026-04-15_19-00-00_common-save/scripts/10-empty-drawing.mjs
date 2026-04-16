// Test saving an empty drawing — what happens with no geometry?
export default async function (api, { snapshot, filewrite }) {
  // Don't create anything — save empty drawing
  const emptyOFB = await api.v1.common.save({ format: 'OFB' })
  console.log('[10] empty OFB success:', emptyOFB.result.success)
  console.log('[10] empty OFB length:', emptyOFB.result.content?.length)
  console.log('[10] empty OFB maxLevel:', emptyOFB.maxLevel)
  console.log('[10] empty OFB messages:', JSON.stringify(emptyOFB.messages))

  const emptySTP = await api.v1.common.save({ format: 'STP' })
  console.log('[10] empty STP success:', emptySTP.result.success)
  console.log('[10] empty STP length:', emptySTP.result.content?.length)
  console.log('[10] empty STP maxLevel:', emptySTP.maxLevel)
  console.log('[10] empty STP messages:', JSON.stringify(emptySTP.messages))

  const emptySTL = await api.v1.common.save({ format: 'STL', encoding: 'base64' })
  console.log('[10] empty STL success:', emptySTL.result.success)
  console.log('[10] empty STL length:', emptySTL.result.content?.length)
  console.log('[10] empty STL maxLevel:', emptySTL.maxLevel)
  console.log('[10] empty STL messages:', JSON.stringify(emptySTL.messages))

  filewrite({
    ofb: { success: emptyOFB.result.success, length: emptyOFB.result.content?.length, maxLevel: emptyOFB.maxLevel, messages: emptyOFB.messages },
    stp: { success: emptySTP.result.success, length: emptySTP.result.content?.length, maxLevel: emptySTP.maxLevel, messages: emptySTP.messages },
    stl: { success: emptySTL.result.success, length: emptySTL.result.content?.length, maxLevel: emptySTL.maxLevel, messages: emptySTL.messages },
  }, 'empty-drawing')

  return {}
}
