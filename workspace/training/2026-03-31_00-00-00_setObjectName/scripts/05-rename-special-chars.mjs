// 05 — Rename with special characters and long names
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  console.log('[05] partId:', partId)

  // Special characters
  const names = [
    'Hello World',        // space
    'Part_With-Dashes',   // dashes + underscores
    'Part.With.Dots',     // dots
    'Part/With/Slashes',  // slashes
    '123NumericStart',    // starts with number
    'Unicode: äöü',       // unicode
    'A'.repeat(200),      // very long name
  ]

  const results = []
  for (const name of names) {
    const r = await api.v1.common.setObjectName({ id: partId, name })
    const display = name.length > 30 ? name.slice(0, 30) + '...' : name
    console.log(`[05] name="${display}" → result:${r.result} maxLevel:${r.maxLevel}`)
    results.push({ name: display, result: r.result, maxLevel: r.maxLevel, messages: r.messages })
  }

  filewrite(results, 'special-chars-results')

  return { partId }
}
