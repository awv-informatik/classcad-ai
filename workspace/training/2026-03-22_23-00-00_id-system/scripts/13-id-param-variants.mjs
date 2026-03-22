// Q: The docs say `string | real | id` — what does the `id` type mean? Can you pass an object?
// Also test: array of IDs, very large integers, fractional-looking strings
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result
  console.log('[13] partId:', partId)

  // Pass as integer (normal)
  const r1 = await execute({ 'v1.part.box': [{ id: 4, name: 'IntId' }] })
  console.log('[13] integer id (4):', r1.result !== null ? '✓' : '❌')

  // Pass as string "4"
  const r2 = await execute({ 'v1.part.box': [{ id: '4', name: 'StrId' }] })
  console.log('[13] string id ("4"):', r2.result !== null ? '✓' : '❌')

  // Pass as string with spaces " 4 "
  const r3 = await execute({ 'v1.part.box': [{ id: ' 4 ', name: 'PaddedStr' }] })
  console.log('[13] padded string (" 4 "):', r3.result !== null ? '✓' : '❌', 'maxLevel:', r3.maxLevel)

  // Pass as "4.0"
  const r4 = await execute({ 'v1.part.box': [{ id: '4.0', name: 'FloatStr' }] })
  console.log('[13] float string ("4.0"):', r4.result !== null ? '✓' : '❌', 'maxLevel:', r4.maxLevel)

  // Pass as an object { id: 4 }
  const r5 = await execute({ 'v1.part.box': [{ id: { id: 4 }, name: 'ObjId' }] })
  console.log('[13] object id ({id:4}):', r5.result !== null ? '✓' : '❌', 'maxLevel:', r5.maxLevel, 'msgs:', JSON.stringify(r5.messages?.map(m => m.message)))

  // Pass as undefined
  const r6 = await execute({ 'v1.part.box': [{ name: 'NoId' }] })
  console.log('[13] omitted id:', r6.result !== null ? '✓' : '❌', 'maxLevel:', r6.maxLevel)

  // Pass as empty string ""
  const r7 = await execute({ 'v1.part.box': [{ id: '', name: 'EmptyStr' }] })
  console.log('[13] empty string (""):', r7.result !== null ? '✓' : '❌', 'maxLevel:', r7.maxLevel)
}
