export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'LP15' }] })).result
  const wcsA = (await execute({ 'v1.part.workCSys': [{ id: partId, offset: [-140, 20, 10] }] })).result
  const wcsB = (await execute({ 'v1.part.workCSys': [{ id: partId, offset: [-140, 50, 10] }] })).result
  const axisX = (await execute({ 'v1.part.workAxis': [{ id: partId, direction: [1, 0, 0] }] })).result

  const boxA = (await execute({ 'v1.part.box': [{ id: partId, references: [wcsA], length: 20, width: 10, height: 8 }] })).result
  const boxB = (await execute({ 'v1.part.box': [{ id: partId, references: [wcsB], length: 20, width: 10, height: 8 }] })).result

  const pattern = (
    await execute({
      'v1.part.linearPattern': [
        { id: partId, name: 'OnlyA', targets: [boxA], dir1: { references: [axisX], distance: 40, count: 2 } },
      ],
    })
  ).result

  const before = (await execute({ 'v1.part.calculateMassProperties': [{ id: partId }] })).result
  await snapshot('15-before-update-targets')

  await execute({ 'v1.part.openFeature': [{ id: pattern }] })
  const update = await execute({ 'v1.part.updateLinearPattern': [{ id: pattern, targets: [boxA, boxB] }] })
  await execute({ 'v1.part.closeFeature': [{ id: pattern }] })

  const after = (await execute({ 'v1.part.calculateMassProperties': [{ id: partId }] })).result
  await snapshot('15-after-update-targets')

  return { partId, boxA, boxB, pattern, before, after, updateResult: update.result, updateMessages: update.messages ?? [] }
}
