// Q: What level values exist? Can we get WARNING level (41)? What about other levels?
// The client filters level <= 31, so we only see 41+
// From script 02: invalid ID produced a WARNING (level 41) alongside errors
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Invalid ID should produce a warning (level 41) - confirmed in script 02
  const r1 = await api.v1.part.box({ id: 999999 })
  console.log('[08] invalid ID messages:')
  for (const m of r1.messages) {
    console.log(`  level=${m.level} levelStr=${m.levelStr} code=${m.code}: ${m.message}`)
  }

  // Try setAppearance on invalid target
  const r2 = await api.v1.common.setAppearance({ id: 999999, color: [255, 0, 0] })
  console.log('[08] setAppearance invalid ID:')
  for (const m of r2.messages) {
    console.log(`  level=${m.level} levelStr=${m.levelStr} code=${m.code}: ${m.message}`)
  }

  // Try setObjectName on invalid target
  const r3 = await api.v1.common.setObjectName({ id: 999999, name: 'Test' })
  console.log('[08] setObjectName invalid ID:')
  for (const m of r3.messages) {
    console.log(`  level=${m.level} levelStr=${m.levelStr} code=${m.code}: ${m.message}`)
  }

  // Collect all unique levels seen
  const allMsgs = [...r1.messages, ...r2.messages, ...r3.messages]
  const levels = [...new Set(allMsgs.map(m => m.level))].sort((a, b) => a - b)
  const levelStrs = [...new Set(allMsgs.map(m => m.levelStr))]
  console.log('[08] unique levels seen:', levels)
  console.log('[08] unique levelStrs seen:', levelStrs)
}
