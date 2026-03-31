// 04 — entityInjection with missing id (no part)
export default async function (api, { filewrite }) {
  // No part created — call entityInjection without id
  const r1 = await api.v1.part.entityInjection({})
  console.log('[04] no id — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[04] no id — messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'no-id-response')

  // Also try with a completely invalid id
  const r2 = await api.v1.part.entityInjection({ id: 999999 })
  console.log('[04] bad id — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[04] bad id — messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'bad-id-response')

  return { noIdResult: r1.result, badIdResult: r2.result }
}
