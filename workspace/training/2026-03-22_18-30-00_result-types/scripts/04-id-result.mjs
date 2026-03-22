// Test: id result type — are IDs always integers? Positive? Sequential?
export default async function ({ execute }) {
  const ids = []
  const labels = []

  // Create multiple objects
  for (const name of ['Part1', 'Part2', 'Part3']) {
    const r = await execute({ 'v1.part.create': [{ name }] })
    ids.push(r.result)
    labels.push(name)
  }

  // Create sketches
  const sk1 = (await execute({ 'v1.sketch.create': [{ id: ids[0] }] })).result
  ids.push(sk1)
  labels.push('Sketch1')

  const sk2 = (await execute({ 'v1.sketch.create': [{ id: ids[1] }] })).result
  ids.push(sk2)
  labels.push('Sketch2')

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    console.log(`[id] ${labels[i]}: value=${id} type=${typeof id} isInteger=${Number.isInteger(id)} isPositive=${id>0}`)
  }

  // Check gaps between sequential IDs
  for (let i = 1; i < ids.length; i++) {
    console.log(`[id] gap ${labels[i-1]}->${labels[i]}: ${ids[i] - ids[i-1]}`)
  }

  console.log(`[id] allIntegers=${ids.every(id => Number.isInteger(id))} allPositive=${ids.every(id => id > 0)} monotonic=${ids.every((id, i) => i === 0 || id > ids[i-1])}`)

  return {}
}
