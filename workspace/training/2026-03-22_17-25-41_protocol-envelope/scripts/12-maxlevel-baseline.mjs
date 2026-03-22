// 12 — Confirm maxLevel baseline and whether it changes with warnings
// Also test: does a warning without an error give maxLevel 41?

export default async function ({ execute }) {
  // Clean success
  const clean = await execute({ 'v1.common.evaluateExpression': [{ expression: '42' }] })
  console.log('[baseline] clean maxLevel:', clean.maxLevel, 'messages:', JSON.stringify(clean.messages))

  // Try to trigger a warning-only scenario
  // Create a part and try to set appearance on an empty part (no solids)
  const part = await execute({ 'v1.part.create': [{ name: 'WarnOnly' }] })
  const appear = await execute({ 'v1.common.setAppearance': [{ target: part.result, color: [255, 0, 0] }] })
  console.log('[warnonly] setAppearance maxLevel:', appear.maxLevel, 'messages:', JSON.stringify(appear.messages, null, 2))

  // Clear with keepIds pointing to nonexistent ID
  const clearBad = await execute({ 'v1.common.clear': [{ keepIds: [999999] }] })
  console.log('[clearBad] maxLevel:', clearBad.maxLevel, 'messages:', JSON.stringify(clearBad.messages, null, 2))

  return {}
}
