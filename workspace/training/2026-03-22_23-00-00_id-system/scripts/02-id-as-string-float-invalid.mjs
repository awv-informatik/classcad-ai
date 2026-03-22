// Q: Can IDs be passed as strings? As floats? As zero? Negative? null?
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result
  console.log('[02] partId:', partId)

  // Pass ID as string
  const r1 = await execute({ 'v1.part.box': [{ id: String(partId), name: 'StringId' }] })
  console.log('[02] string id:', r1.result !== null ? '✓ OK' : '❌ FAIL', 'result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Pass ID as float
  const r2 = await execute({ 'v1.part.box': [{ id: partId + 0.5, name: 'FloatId' }] })
  console.log('[02] float id:', r2.result !== null ? '✓ OK' : '❌ FAIL', 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  // Pass ID as zero
  const r3 = await execute({ 'v1.part.box': [{ id: 0, name: 'ZeroId' }] })
  console.log('[02] zero id:', r3.result !== null ? '✓ OK' : '❌ FAIL', 'maxLevel:', r3.maxLevel, 'msgs:', JSON.stringify(r3.messages))

  // Pass ID as negative
  const r4 = await execute({ 'v1.part.box': [{ id: -1, name: 'NegId' }] })
  console.log('[02] negative id:', r4.result !== null ? '✓ OK' : '❌ FAIL', 'maxLevel:', r4.maxLevel, 'msgs:', JSON.stringify(r4.messages))

  // Pass ID as null
  const r5 = await execute({ 'v1.part.box': [{ id: null, name: 'NullId' }] })
  console.log('[02] null id:', r5.result !== null ? '✓ OK' : '❌ FAIL', 'maxLevel:', r5.maxLevel, 'msgs:', JSON.stringify(r5.messages))

  // Pass ID as boolean true
  const r6 = await execute({ 'v1.part.box': [{ id: true, name: 'BoolId' }] })
  console.log('[02] bool id:', r6.result !== null ? '✓ OK' : '❌ FAIL', 'maxLevel:', r6.maxLevel, 'msgs:', JSON.stringify(r6.messages))

  // Pass nonexistent ID (99999)
  const r7 = await execute({ 'v1.part.box': [{ id: 99999, name: 'NonexistId' }] })
  console.log('[02] nonexist id:', r7.result !== null ? '✓ OK' : '❌ FAIL', 'maxLevel:', r7.maxLevel, 'msgs:', JSON.stringify(r7.messages))
}
