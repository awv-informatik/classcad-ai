// 07: Dump the full split structure to identify segments, then trim selectively
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimDump' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Circle + horizontal line through it
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const line = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result
  console.log('[07] circle:', circle, 'line:', line)

  await snapshot('before')

  // Split
  const splitRes = await api.v1.sketch.splitAllCurves({ id: skId })
  const splitIds = splitRes.result
  console.log('[07] split IDs:', JSON.stringify(splitIds))

  // Dump the structure
  filewrite(splitRes.structure, 'split-structure')

  // Check the type of structure to understand how to access it
  console.log('[07] structure type:', typeof splitRes.structure)
  console.log('[07] structure is array:', Array.isArray(splitRes.structure))

  // Try to find our IDs
  const struct = splitRes.structure
  for (const id of splitIds) {
    const key = String(id)
    // Try direct key access
    if (struct[key]) {
      console.log('[07] FOUND direct key', key, ':', struct[key].name, struct[key].class)
    } else {
      console.log('[07] NOT found as direct key:', key)
    }
  }

  // Also try looking at it as an array or nested structure
  if (typeof struct === 'object' && !Array.isArray(struct)) {
    const topKeys = Object.keys(struct).slice(0, 10)
    console.log('[07] top-level structure keys (first 10):', JSON.stringify(topKeys))
  }

  // Now trim just 2 segments — the line inside the circle and the bottom arc
  // First, snapshot after split
  await snapshot('after-split')

  // Trim segment 0 only and snapshot
  const trimRes = await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitIds[0]] })
  console.log('[07] trimmed id', splitIds[0], 'maxLevel:', trimRes.maxLevel)
  await snapshot('after-trim-0')

  return { partId }
}
