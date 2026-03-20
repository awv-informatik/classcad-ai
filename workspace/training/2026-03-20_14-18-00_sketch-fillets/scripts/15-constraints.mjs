// 15: getConstraints after fillet — verify constraint types
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Constraints' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  const lines = (await execute({ 'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [100, 80, 0] }] })).result

  // Get constraints before fillet
  const cBefore = await execute({ 'v1.sketch.getConstraints': [{ id: skId }] })
  console.log('Constraints before:', JSON.stringify(cBefore.result?.length || 0), 'total')

  // Fillet one corner
  const f = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[0], lines[1]], offset: 10 }] })

  // Get constraints after fillet
  const cAfter = await execute({ 'v1.sketch.getConstraints': [{ id: skId }] })
  console.log('Constraints after:', JSON.stringify(cAfter.result?.length || 0), 'total')

  // Show the new constraints (diff)
  const newCount = (cAfter.result?.length || 0) - (cBefore.result?.length || 0)
  console.log('New constraints added:', newCount)
  if (cAfter.result) {
    // Show last N constraints (the fillet ones)
    const newConstraints = cAfter.result.slice(-newCount)
    for (const c of newConstraints) {
      console.log('  ', JSON.stringify(c))
    }
  }

  return { before: cBefore.result?.length, after: cAfter.result?.length }
}
