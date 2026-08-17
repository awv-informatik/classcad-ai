// Test sketch.geometry — genTangency flag
// Create a line and arc that share an endpoint — tangency may be auto-generated
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result

  // Helper
  async function test(flags, label) {
    const skId = (await api.v1.sketch.create({ id: partId })).result
    const r = await api.v1.sketch.geometry({
      id: skId,
      lines: [{ startPos: [0, 0, 0], endPos: [30, 0, 0] }],
      arcsBy3Points: [{ startPos: [30, 0, 0], endPos: [50, 20, 0], midPos: [40, 5, 0] }],
      ...flags,
    })

    function walkAll(obj) {
      const found = []
      if (!obj || typeof obj !== 'object') return found
      if (obj.typeName && obj.typeName.toLowerCase().includes('tangent')) {
        found.push({ typeName: obj.typeName, name: obj.name })
      }
      if (Array.isArray(obj)) {
        obj.forEach(item => found.push(...walkAll(item)))
      } else {
        for (const key of Object.keys(obj)) {
          found.push(...walkAll(obj[key]))
        }
      }
      return found
    }

    const tangents = walkAll(r.structure)
    console.log(`[12] ${label}: ${tangents.length} tangency constraints`)
    tangents.forEach(t => console.log(`  - ${t.typeName}: ${t.name}`))
    return { label, tangents }
  }

  const def = await test({}, 'default (genTangency=TRUE)')
  const off = await test({ genTangency: false }, 'genTangency=false')
  filewrite({ default: def, off }, 'tangency-comparison')

  return { partId }
}
