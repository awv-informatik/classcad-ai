// Q: What happens when you pass a part ID or EI ID directly to curve.line?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'MyEI' })).result
  console.log('[03] partId:', partId, 'eifId:', eifId)

  // Try passing EI ID to curve.line (should need shape ID)
  const r1 = await api.v1.curve.line({ id: eifId, startPos: [0, 0, 0], endPos: [50, 50, 0] })
  console.log('[03] curve.line with eifId — result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages) {
    for (const m of r1.messages) {
      console.log('[03] ei msg:', m.message, 'level:', m.level)
    }
  }

  // Try passing part ID to curve.line
  const r2 = await api.v1.curve.line({ id: partId, startPos: [0, 0, 0], endPos: [50, 50, 0] })
  console.log('[03] curve.line with partId — result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages) {
    for (const m of r2.messages) {
      console.log('[03] part msg:', m.message, 'level:', m.level)
    }
  }

  filewrite({
    withEifId: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    withPartId: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
  }, 'curve-line-wrong-ids')

  return { partId, eifId }
}
