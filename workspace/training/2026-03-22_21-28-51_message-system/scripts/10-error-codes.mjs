// Q: Are error codes consistent across APIs? Do the same error types always get the same code?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Code 1004: missing required param — test across domains
  const e1 = await api.v1.part.box({})                                 // part domain
  const e2 = await api.v1.sketch.create({})                             // sketch domain
  const e3 = await api.v1.part.extrusion({})                            // part domain, different api
  const e4 = await api.v1.common.setAppearance({})                      // common domain

  console.log('[10] missing param codes:')
  for (const [label, r] of [['part.box', e1], ['sketch.create', e2], ['part.extrusion', e3], ['common.setAppearance', e4]]) {
    for (const m of r.messages) {
      console.log(`  ${label}: code=${m.code} level=${m.level} api=${m.api}`)
    }
  }

  // Code 1006: invalid ID — test across domains
  const e5 = await api.v1.part.box({ id: 999999 })
  const e6 = await api.v1.common.setObjectName({ id: 999999, name: 'x' })

  console.log('[10] invalid ID codes:')
  for (const [label, r] of [['part.box', e5], ['setObjectName', e6]]) {
    for (const m of r.messages) {
      console.log(`  ${label}: code=${m.code} level=${m.level} api=${m.api}`)
    }
  }

  // Code 1201: unknown command
  const e7 = await api.v1.part.nonexistent({})
  const e8 = await api.v1.common.nonexistent({})
  console.log('[10] unknown command codes:')
  for (const [label, r] of [['part.fake', e7], ['common.fake', e8]]) {
    for (const m of r.messages) {
      console.log(`  ${label}: code=${m.code} level=${m.level} api=${m.api || '(none)'}`)
    }
  }

  // Collect all unique codes
  const allMsgs = [...e1.messages, ...e2.messages, ...e3.messages, ...e4.messages, ...e5.messages, ...e6.messages, ...e7.messages, ...e8.messages]
  const codes = [...new Set(allMsgs.map(m => m.code))].sort((a, b) => a - b)
  console.log('[10] all codes seen:', codes)
}
