// Isolated test: ALL gen flags OFF — single part, single sketch
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FlagsOff' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.geometry({
    id: skId,
    lines: [
      { startPos: [0, 0, 0], endPos: [50, 0, 0] },
      { startPos: [50, 0, 0], endPos: [50, 50, 0] },
    ],
    genFixation: false,
    genIncidence: false,
    genVertAndHoriz: false,
    genTangency: false,
  })

  // Find ALL constraint-class nodes
  const constraints = []
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return
    if (obj.class && typeof obj.class === 'string' && obj.class.includes('Constraint')) {
      constraints.push({ name: obj.name, class: obj.class, id: obj.id })
    }
    if (Array.isArray(obj)) obj.forEach(walk)
    else for (const v of Object.values(obj)) walk(v)
  }
  walk(r.structure)

  console.log('[19] ALL flags OFF, isolated: found', constraints.length, 'constraints')
  constraints.forEach(c => console.log(`  - ${c.class} (${c.name}) id=${c.id}`))
  filewrite({ constraints, count: constraints.length }, 'allflags-off-isolated')

  return { partId }
}
