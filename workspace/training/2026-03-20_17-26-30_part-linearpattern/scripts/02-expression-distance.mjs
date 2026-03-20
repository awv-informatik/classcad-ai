export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'LP02' }] })).result
  const wcs = (await execute({ 'v1.part.workCSys': [{ id: partId, offset: [-120, 30, 10] }] })).result
  const axisX = (await execute({ 'v1.part.workAxis': [{ id: partId, position: [0, 0, 0], direction: [1, 0, 0] }] })).result
  const box = (
    await execute({ 'v1.part.box': [{ id: partId, references: [wcs], length: 20, width: 10, height: 8 }] })
  ).result

  await snapshot('02-before-pattern')

  const pattern = (
    await execute({
      'v1.part.linearPattern': [
        {
          id: partId,
          targets: [{ id: box }],
          dir1: { references: [axisX], distance: '90/3', count: 4 },
        },
      ],
    })
  ).result

  const mass = (await execute({ 'v1.part.calculateMassProperties': [{ id: partId }] })).result
  await snapshot('02-after-pattern')

  return { partId, box, pattern, mass }
}
