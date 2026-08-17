export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolTest' })).result

  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 20, height: 50 })).result
  console.log('[10] boxId:', boxId, 'cylId:', cylId)

  // Snapshot before boolean
  await snapshot('before-boolean')

  // Boolean subtraction — consumes the cylinder
  const boolRes = await api.v1.part.boolean({
    id: partId,
    name: 'Bool1',
    type: 'SUBTRACTION',
    target: boxId,
    tools: [cylId],
  })
  console.log('[10] boolean result:', boolRes.result, 'maxLevel:', boolRes.maxLevel)

  await snapshot('after-boolean')

  // Part-level mass props after boolean
  const rPart = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[10] part result:', JSON.stringify(rPart.result))
  console.log('[10] part maxLevel:', rPart.maxLevel)

  // Try boxId (consumed by boolean? let's see)
  const rBox = await api.v1.part.calculateMassProperties({ id: boxId })
  console.log('[10] consumed box result:', JSON.stringify(rBox.result))
  console.log('[10] consumed box maxLevel:', rBox.maxLevel)
  console.log('[10] consumed box messages:', JSON.stringify(rBox.messages))

  filewrite({
    part: { result: rPart.result, maxLevel: rPart.maxLevel },
    consumedBox: { result: rBox.result, maxLevel: rBox.maxLevel, messages: rBox.messages },
  }, 'boolean-consumed')

  // Box: 80*60*40 = 192000
  // Cyl: π*10²*40 = 12566.37 (limited by box height=40)
  // Actually cyl height=50 but it extends above the box. The boolean subtracts the intersection.
  // The volume subtracted depends on the overlap. Cyl is at origin, box from [0,0,0] to [80,60,40].
  // Actually wait — part.cylinder places it differently. Let me just compare numbers.
  console.log('[10] box vol:', 80 * 60 * 40, '= 192000')

  return { partId }
}
