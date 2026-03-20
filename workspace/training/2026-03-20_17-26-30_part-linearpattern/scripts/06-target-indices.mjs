export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'LP06' }] })).result
  const wcs = (await execute({ 'v1.part.workCSys': [{ id: partId, offset: [-140, 20, 10] }] })).result
  const axisX = (await execute({ 'v1.part.workAxis': [{ id: partId, position: [0, 0, 0], direction: [1, 0, 0] }] })).result
  const axisY = (await execute({ 'v1.part.workAxis': [{ id: partId, position: [0, 0, 0], direction: [0, 1, 0] }] })).result

  const seed = (
    await execute({ 'v1.part.box': [{ id: partId, references: [wcs], length: 20, width: 10, height: 8 }] })
  ).result

  const p1 = (
    await execute({
      'v1.part.linearPattern': [{ id: partId, name: 'P1', targets: [seed], dir1: { references: [axisX], distance: 35, count: 3 } }],
    })
  ).result

  const massBeforeP2 = (await execute({ 'v1.part.calculateMassProperties': [{ id: partId }] })).result
  await snapshot('06-before-second-pattern')

  const p2 = (
    await execute({
      'v1.part.linearPattern': [
        {
          id: partId,
          name: 'P2',
          targets: [{ id: p1, indices: [1] }],
          dir1: { references: [axisY], distance: 30, count: 2 },
        },
      ],
    })
  ).result

  const massAfterP2 = (await execute({ 'v1.part.calculateMassProperties': [{ id: partId }] })).result
  await snapshot('06-after-second-pattern')

  return { partId, seed, p1, p2, massBeforeP2, massAfterP2 }
}
