export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'LP12' }] })).result
  const wcs = (await execute({ 'v1.part.workCSys': [{ id: partId, offset: [-110, 20, 10] }] })).result

  const p1 = (await execute({ 'v1.part.workPoint': [{ id: partId, position: [0, 0, 0] }] })).result
  const p2 = (await execute({ 'v1.part.workPoint': [{ id: partId, position: [0, 80, 0] }] })).result

  const box = (await execute({ 'v1.part.box': [{ id: partId, references: [wcs], length: 20, width: 10, height: 8 }] })).result

  await snapshot('12-before-pattern')

  const pattern = (
    await execute({
      'v1.part.linearPattern': [
        { id: partId, targets: [box], dir1: { references: [p1, p2], distance: 25, count: 4 } },
      ],
    })
  ).result

  const mass = (await execute({ 'v1.part.calculateMassProperties': [{ id: partId }] })).result
  await snapshot('12-after-pattern')

  return { partId, p1, p2, box, pattern, mass }
}
