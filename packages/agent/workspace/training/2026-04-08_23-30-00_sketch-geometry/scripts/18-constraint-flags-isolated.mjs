// Constraint flag comparison — isolated parts per test
export default async function (api, { filewrite }) {
  function findConstraints(structure) {
    const found = []
    if (!structure) return found
    function walk(obj) {
      if (!obj || typeof obj !== 'object') return
      if (obj.class && typeof obj.class === 'string' && obj.class.includes('Constraint')) {
        found.push({ name: obj.name, class: obj.class })
      }
      if (Array.isArray(obj)) {
        obj.forEach(walk)
      } else {
        for (const v of Object.values(obj)) walk(v)
      }
    }
    walk(structure)
    return found
  }

  async function test(flags, label) {
    // Fresh part for each test — no accumulation
    const partId = (await api.v1.part.create({ name: label })).result
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
    console.log(`[18] ${label}: ${constraints.length} constraints`)
    constraints.forEach(c => console.log(`  - ${c.class} (${c.name})`))
    return { label, count: constraints.length, constraints: constraints.map(c => c.class + ':' + c.name) }
  }

  const results = {
    allDefaults: await test({}, 'all-defaults'),
    noFixation: await test({ genFixation: false }, 'no-fixation'),
    noIncidence: await test({ genIncidence: false }, 'no-incidence'),
    noVertHoriz: await test({ genVertAndHoriz: false }, 'no-vert-horiz'),
    allOff: await test({
      genFixation: false, genIncidence: false,
      genVertAndHoriz: false, genTangency: false,
    }, 'all-off'),
  }

  filewrite(results, 'constraint-flags-isolated')
  return {}
}
