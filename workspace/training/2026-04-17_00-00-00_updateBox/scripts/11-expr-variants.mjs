export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, name: 'H', value: 80 })

  // Test 1: Create box WITH @expr — does it work at creation?
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: '@expr.H' })).result
  console.log('[11] box with @expr.H — boxId:', boxId)

  // Test 2: Try updateBox with @expr on single param
  await api.v1.part.openFeature({ id: boxId })
  const up1 = await api.v1.part.updateBox({ id: boxId, height: '@expr.H' })
  console.log('[11] updateBox(@expr.H) — result:', up1.result, 'maxLevel:', up1.maxLevel)
  filewrite({ result: up1.result, messages: up1.messages, maxLevel: up1.maxLevel }, 'expr-single-response')

  // Test 3: Try bare expression name (no @expr. prefix)
  const up2 = await api.v1.part.updateBox({ id: boxId, height: 'H' })
  console.log('[11] updateBox("H") — result:', up2.result, 'maxLevel:', up2.maxLevel)
  filewrite({ result: up2.result, messages: up2.messages, maxLevel: up2.maxLevel }, 'bare-name-response')

  // Test 4: Try numeric string
  const up3 = await api.v1.part.updateBox({ id: boxId, height: '100' })
  console.log('[11] updateBox("100") — result:', up3.result, 'maxLevel:', up3.maxLevel)
  filewrite({ result: up3.result, messages: up3.messages, maxLevel: up3.maxLevel }, 'numeric-string-response')

  await api.v1.part.closeFeature({ id: boxId })

  return { partId, boxId }
}
