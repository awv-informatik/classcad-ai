// Proper constraint flag comparison using 'class' field in structure tree
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result

  function findConstraints(structure) {
    const found = []
    if (!structure) return found
    // structure is { tree: { <id>: node, ... } } or similar
    // Walk all values recursively looking for 'class' containing 'Constraint'
    function walk(obj) {
      if (!obj || typeof obj !== 'object') return
      if (obj.class && typeof obj.class === 'string' && obj.class.includes('Constraint')) {
        found.push({ name: obj.name, class: obj.class, id: obj.id })
      }
      if (Array.isArray(obj)) {
        obj.forEach(walk)
      } else {
        for (const v of Object.values(obj)) {
          walk(v)
        }
      }
    }
    walk(structure)
    return found
  }

  async function test(flags, label) {
    const skId = (await api.v1.sketch.create({ id: partId })).result
    const r = await api.v1.sketch.geometry({
      id: skId,
      lines: [
        { startPos: [0, 0, 0], endPos: [50, 0, 0] },   // horizontal, at origin
        { startPos: [50, 0, 0], endPos: [50, 50, 0] },  // vertical, shared endpoint
      ],
      ...flags,
    })
    const constraints = findConstraints(r.structure)
    console.log(`[17] ${label}: ${constraints.length} constraints`)
    constraints.forEach(c => console.log(`  - ${c.class} (${c.name})`))
    return { label, constraints: constraints.map(c => c.class + ':' + c.name) }
  }

  const results = {
    allDefaults: await test({}, 'all defaults'),
    noFixation: await test({ genFixation: false }, 'genFixation=false'),
    noIncidence: await test({ genIncidence: false }, 'genIncidence=false'),
    noVertHoriz: await test({ genVertAndHoriz: false }, 'genVertAndHoriz=false'),
    allOff: await test({
      genFixation: false, genIncidence: false,
      genVertAndHoriz: false, genTangency: false,
    }, 'all OFF'),
  }

  filewrite(results, 'constraint-flags-proper')
  return { partId }
}
