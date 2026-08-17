// Follow-up: Part2/Part3 returned null in script 04 — can we create multiple parts?
// Is it a drawing limitation or something else?
export default async function (api) {
  const p1 = await api.v1.part.create({ name: 'First' })
  console.log(`[multi] Part1: result=${p1.result} maxLevel=${p1.maxLevel} msgs=${JSON.stringify(p1.messages)}`)

  const p2 = await api.v1.part.create({ name: 'Second' })
  console.log(`[multi] Part2: result=${p2.result} maxLevel=${p2.maxLevel} msgs=${JSON.stringify(p2.messages)}`)

  const p3 = await api.v1.part.create({ name: 'Third' })
  console.log(`[multi] Part3: result=${p3.result} maxLevel=${p3.maxLevel} msgs=${JSON.stringify(p3.messages)}`)

  // Check: does sketch.create fail on null part ID?
  if (p2.result !== null) {
    const sk = await api.v1.sketch.create({ id: p2.result })
    console.log(`[multi] Sketch on Part2: result=${sk.result} maxLevel=${sk.maxLevel}`)
  } else {
    console.log('[multi] Skipping sketch — Part2 was null')
  }

  return {}
}
