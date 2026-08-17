// Analyze structure trees: count constraints under each sketch to see genFlag effects
// Reuses files from scripts 08-10
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AnalysisTest' })).result

  // Helper: create geometry and count constraint-like nodes in the structure
  async function testFlags(flags, label) {
    const skId = (await api.v1.sketch.create({ id: partId })).result
    const r = await api.v1.sketch.geometry({
      id: skId,
      lines: [
        { startPos: [0, 0, 0], endPos: [50, 0, 0] },   // horizontal
        { startPos: [50, 0, 0], endPos: [50, 50, 0] },  // vertical, shared endpoint
      ],
      ...flags,
    })

    // Walk the structure tree to find constraint nodes under this sketch
    function findConstraints(node, depth = 0) {
      const constraints = []
      if (node && node.name && (
        node.name.includes('Constraint') ||
        node.name.includes('Fixation') ||
        node.name.includes('Coincidence') ||
        node.name.includes('Horizontal') ||
        node.name.includes('Vertical') ||
        node.name.includes('Tangent')
      )) {
        constraints.push(node.name)
      }
      if (node.children) {
        for (const child of node.children) {
          constraints.push(...findConstraints(child, depth + 1))
        }
      }
      return constraints
    }

    // Search entire structure for constraint-like things
    function walkAll(obj, path = '') {
      const found = []
      if (!obj || typeof obj !== 'object') return found
      if (obj.typeName && (
        obj.typeName.includes('Constraint') ||
        obj.typeName.includes('Fixation') ||
        obj.typeName.includes('Coincident') ||
        obj.typeName.includes('Horizontal') ||
        obj.typeName.includes('Vertical') ||
        obj.typeName.includes('Tangent') ||
        obj.typeName.includes('constraint')
      )) {
        found.push({ path, typeName: obj.typeName, name: obj.name })
      }
      if (Array.isArray(obj)) {
        obj.forEach((item, i) => found.push(...walkAll(item, `${path}[${i}]`)))
      } else {
        for (const key of Object.keys(obj)) {
          found.push(...walkAll(obj[key], `${path}.${key}`))
        }
      }
      return found
    }

    const constraints = walkAll(r.structure)
    console.log(`[11] ${label}: ${constraints.length} constraint nodes`)
    constraints.forEach(c => console.log(`  - ${c.typeName}: ${c.name}`))
    return { label, constraintCount: constraints.length, constraints, skId }
  }

  const results = {}
  results.allDefaults = await testFlags({}, 'all defaults (TRUE)')
  results.noFixation = await testFlags({ genFixation: false }, 'genFixation=false')
  results.noIncidence = await testFlags({ genIncidence: false }, 'genIncidence=false')
  results.noVertHoriz = await testFlags({ genVertAndHoriz: false }, 'genVertAndHoriz=false')
  results.allOff = await testFlags({
    genFixation: false,
    genIncidence: false,
    genVertAndHoriz: false,
    genTangency: false,
  }, 'all gen flags OFF')

  filewrite({
    allDefaults: { count: results.allDefaults.constraintCount, names: results.allDefaults.constraints.map(c => c.typeName + ':' + c.name) },
    noFixation: { count: results.noFixation.constraintCount, names: results.noFixation.constraints.map(c => c.typeName + ':' + c.name) },
    noIncidence: { count: results.noIncidence.constraintCount, names: results.noIncidence.constraints.map(c => c.typeName + ':' + c.name) },
    noVertHoriz: { count: results.noVertHoriz.constraintCount, names: results.noVertHoriz.constraints.map(c => c.typeName + ':' + c.name) },
    allOff: { count: results.allOff.constraintCount, names: results.allOff.constraints.map(c => c.typeName + ':' + c.name) },
  }, 'constraint-comparison')

  return { partId }
}
