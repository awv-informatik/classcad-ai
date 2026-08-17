// Deep-search the structure tree for anything constraint-related
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create geometry that should trigger auto-constraints
  const r = await api.v1.sketch.geometry({
    id: skId,
    lines: [
      { startPos: [0, 0, 0], endPos: [50, 0, 0] },   // horizontal, at origin
      { startPos: [50, 0, 0], endPos: [50, 50, 0] },  // vertical, shared endpoint
    ],
  })

  // Collect ALL unique typeName values in the structure
  function collectTypeNames(obj, seen = new Set()) {
    if (!obj || typeof obj !== 'object') return seen
    if (obj.typeName && !seen.has(obj.typeName)) {
      seen.add(obj.typeName)
    }
    if (Array.isArray(obj)) {
      obj.forEach(item => collectTypeNames(item, seen))
    } else {
      for (const key of Object.keys(obj)) {
        collectTypeNames(obj[key], seen)
      }
    }
    return seen
  }

  const typeNames = [...collectTypeNames(r.structure)].sort()
  console.log('[16] All typeNames in structure:', typeNames.join(', '))
  filewrite(typeNames, 'all-type-names')

  // Also look for any key or value containing "constr" or "fix" (case-insensitive)
  function searchForPattern(obj, path = '', results = []) {
    if (!obj || typeof obj !== 'object') return results
    for (const key of Object.keys(obj)) {
      const v = obj[key]
      if (typeof key === 'string' && /constr|fix|horiz|vert|incid|tang|coinc/i.test(key)) {
        results.push({ path: `${path}.${key}`, value: typeof v === 'object' ? '[object]' : v })
      }
      if (typeof v === 'string' && /constr|fix|horiz|vert|incid|tang|coinc/i.test(v)) {
        results.push({ path: `${path}.${key}`, value: v })
      }
      if (typeof v === 'object') {
        searchForPattern(v, `${path}.${key}`, results)
      }
    }
    return results
  }

  const matches = searchForPattern(r.structure)
  console.log('[16] Constraint-related matches:', matches.length)
  matches.slice(0, 30).forEach(m => console.log(`  ${m.path} = ${m.value}`))
  filewrite(matches, 'constraint-matches')

  return { partId }
}
