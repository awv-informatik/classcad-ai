export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvalidRefTest' })).result

  // Try with a bogus ID
  const r1 = await api.v1.part.compositeCurve({ id: partId, name: 'CC_Bad', references: [99999] })
  console.log('[11] bogus ID result:', r1.result)
  console.log('[11] bogus ID maxLevel:', r1.maxLevel)
  if (r1.messages && r1.messages.length > 0) {
    console.log('[11] bogus ID messages:', JSON.stringify(r1.messages))
  }

  // Try with the part ID itself (wrong type)
  const r2 = await api.v1.part.compositeCurve({ id: partId, name: 'CC_Part', references: [partId] })
  console.log('[11] part ID result:', r2.result)
  console.log('[11] part ID maxLevel:', r2.maxLevel)
  if (r2.messages && r2.messages.length > 0) {
    console.log('[11] part ID messages:', JSON.stringify(r2.messages))
  }

  filewrite({
    bogus: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    partRef: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
  }, 'invalid-ref-responses')

  return { partId }
}
