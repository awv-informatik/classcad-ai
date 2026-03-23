// Q: Verify matrix layout by reading work axis directions after transformation
// Work axes XAxis(26), YAxis(30), ZAxis(34) have Direction members
export default async function ({ execute }, { filewrite }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result

  // Read work axis directions before
  const r0 = await execute({ 'v1.common.getAppVersion': [{}] })
  const xAxis = r0.structure.tree['26']
  const yAxis = r0.structure.tree['30']
  console.log('[10] XAxis before:', JSON.stringify(xAxis.members))
  console.log('[10] YAxis before:', JSON.stringify(yAxis.members))

  // Apply 90° rotation around Z (column-format: standard math convention)
  await execute({
    'v1.common.transformObjectWithMatrix': [{
      id: partId,
      matrix: [
        [0, -1, 0, 0],
        [1, 0, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ]
    }]
  })

  // Read work axis directions after
  const r1 = await execute({ 'v1.common.getAppVersion': [{}] })
  const xAxisAfter = r1.structure.tree['26']
  const yAxisAfter = r1.structure.tree['30']
  console.log('[10] XAxis after 90° Z (col-format):', JSON.stringify(xAxisAfter.members))
  console.log('[10] YAxis after 90° Z (col-format):', JSON.stringify(yAxisAfter.members))

  // If column-format is correct:
  // X axis [1,0,0] → rotated 90° CCW in XY → [0,1,0]
  // Y axis [0,1,0] → rotated 90° CCW in XY → [-1,0,0]
  // If the axis directions DIDN'T change, the transform works on the part coord system
  // and the axes remain in local coords

  return {}
}
