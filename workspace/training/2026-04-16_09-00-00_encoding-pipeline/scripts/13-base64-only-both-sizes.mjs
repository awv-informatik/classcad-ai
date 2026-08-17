// Compare sizes across all formats with all encoding combos
// Comprehensive size matrix
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SizeMatrix' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })
  // Add a sphere for mixed geometry
  await api.v1.solid.sphere({ id: eifId, radius: 15, translation: [100, 0, 0] })

  const formats = ['OFB', 'STP', 'STL', 'SCG', 'IWP']
  const combos = [
    { label: 'raw', params: {} },
    { label: 'b64', params: { encoding: 'base64' } },
    { label: 'deflate+b64', params: { encoding: 'base64', compression: 'deflate' } },
  ]

  const matrix = {}

  for (const fmt of formats) {
    matrix[fmt] = {}
    for (const combo of combos) {
      try {
        const r = await api.v1.common.save({ format: fmt, ...combo.params })
        matrix[fmt][combo.label] = {
          len: r.result.content?.length || 0,
          success: r.result.success,
        }
        console.log(`[13] ${fmt} ${combo.label}: len=${r.result.content?.length} success=${r.result.success}`)
      } catch (e) {
        matrix[fmt][combo.label] = { error: e.message }
        console.log(`[13] ${fmt} ${combo.label}: ERROR ${e.message}`)
      }
    }
    // Compute ratios
    const rawLen = matrix[fmt].raw?.len || 1
    if (matrix[fmt].b64?.len) {
      matrix[fmt].b64.ratio = (matrix[fmt].b64.len / rawLen).toFixed(3)
    }
    if (matrix[fmt]['deflate+b64']?.len) {
      matrix[fmt]['deflate+b64'].ratio = (matrix[fmt]['deflate+b64'].len / rawLen).toFixed(3)
    }
  }

  console.log('[13] MATRIX:', JSON.stringify(matrix, null, 2))
  filewrite(matrix, 'size-matrix')

  return { partId }
}
