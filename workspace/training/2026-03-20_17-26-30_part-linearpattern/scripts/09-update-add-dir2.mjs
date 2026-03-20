export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'LP09' }] })).result
  const wcs = (await execute({ 'v1.part.workCSys': [{ id: partId, offset: [-120, 20, 10] }] })).result
  const axisX = (await execute({ 'v1.part.workAxis': [{ id: partId, direction: [1, 0, 0] }] })).result
  const axisY = (await execute({ 'v1.part.workAxis': [{ id: partId, direction: [0, 1, 0] }] })).result
  const box = (await execute({ 'v1.part.box': [{ id: partId, references: [wcs], length: 20, width: 10, height: 8 }] })).result
  const pattern = (
    await execute({ 'v1.part.linearPattern': [{ id: partId, targets: [box], dir1: { references: [axisX], distance: 35, count: 2 } }] })
  ).result

  const before = (await execute({ 'v1.part.calculateMassProperties': [{ id: partId }] })).result
  await snapshot('09-before-update')

  await execute({ 'v1.part.openFeature': [{ id: pattern }] })
  const update = await execute({
    'v1.part.updateLinearPattern': [
      { id: pattern, dir2: { references: [axisY], distance: 25, count: 3 } },
    ],
  })
  await execute({ 'v1.part.closeFeature': [{ id: pattern }] })

  const after = (await execute({ 'v1.part.calculateMassProperties': [{ id: partId }] })).result
  await snapshot('09-after-update')

  return { partId, pattern, before, after, updateResult: update.result, updateMessages: update.messages ?? [] }
}
