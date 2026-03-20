/**
 * extract.mjs — Extract all queryable data from a ClassCAD drawing.
 *
 * Given a connected client and the IDs produced by a script, extracts:
 * mass properties, BRep topology (faces/edges/vertices), geometry positions,
 * bounding box, and the full structure tree.
 */

/**
 * Enumerate BRep elements by index until no more are found.
 * @param {Function} execute
 * @param {number|string} eifId  Entity injection feature ID
 * @param {string} indexKey      "faceIndex" | "lineIndex" | "pointIndex"
 * @param {number} [solidIndex]  Optional solid index (for multi-solid parts)
 * @returns {Promise<number[]>}  Array of BRep element IDs (negative ints)
 */
async function enumerateBrep(execute, eifId, indexKey, solidIndex) {
  const ids = []
  for (let i = 0; i < 500; i++) {
    const param = { id: eifId, [indexKey]: i }
    if (solidIndex !== undefined) param.solidIndex = solidIndex
    const r = await execute({ 'v1.part.getBrepGeometryByIndex': [param] })
    if (r.result === undefined || r.result === null) break
    ids.push(r.result)
  }
  return ids
}

/**
 * Compute axis-aligned bounding box from an array of {x,y,z} positions.
 */
function computeBounds(positions) {
  if (!positions.length) return null
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (const p of positions) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y
    if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z
  }
  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] }
}

/**
 * Extract all possible data from the current drawing.
 *
 * @param {{ execute: Function, request: Function }} client
 * @param {{ partId: number, eifId: number, solidIds?: number[] }} ids
 * @returns {Promise<object>} Extracted data
 */
export async function extractAll(client, { partId, eifId, solidIds = [] }) {
  const { execute, request } = client
  const errors = []

  // 1. Mass properties
  let massProperties = null
  try {
    const r = await execute({ 'v1.part.calculateMassProperties': [{ id: partId }] })
    massProperties = r.result
  } catch (e) { errors.push({ step: 'massProperties', error: e.message }) }

  // 2. BRep enumeration
  let brep = { faces: { count: 0, ids: [] }, edges: { count: 0, ids: [] }, vertices: { count: 0, ids: [] } }
  try {
    const faceIds = await enumerateBrep(execute, eifId, 'faceIndex')
    const edgeIds = await enumerateBrep(execute, eifId, 'lineIndex')
    const vertexIds = await enumerateBrep(execute, eifId, 'pointIndex')
    brep = {
      faces: { count: faceIds.length, ids: faceIds },
      edges: { count: edgeIds.length, ids: edgeIds },
      vertices: { count: vertexIds.length, ids: vertexIds },
    }
  } catch (e) { errors.push({ step: 'brep', error: e.message }) }

  // 3. Geometry positions for all BRep elements
  let geometry = { positions: [] }
  try {
    const allIds = [...brep.faces.ids, ...brep.edges.ids, ...brep.vertices.ids]
    if (allIds.length > 0) {
      const r = await execute({ 'v1.part.getGeometryPositions': [{ elems: allIds }] })
      geometry.positions = r.result || []
    }
  } catch (e) { errors.push({ step: 'geometry', error: e.message }) }

  // 4. Bounding box (computed from vertex positions)
  let bounds = null
  try {
    const allPoints = []
    for (const entry of geometry.positions) {
      if (entry && entry.positions) {
        for (const p of entry.positions) {
          allPoints.push(p)
        }
      }
    }
    bounds = computeBounds(allPoints)
  } catch (e) { errors.push({ step: 'bounds', error: e.message }) }

  // 5. Structure tree
  let structure = null
  try {
    const r = await request('GetTree')
    structure = r.structure || null
  } catch (e) { errors.push({ step: 'structure', error: e.message }) }

  return {
    massProperties,
    brep,
    geometry,
    bounds,
    structure,
    errors,
  }
}
