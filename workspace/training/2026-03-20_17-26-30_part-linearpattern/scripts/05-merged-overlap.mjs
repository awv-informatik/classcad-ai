export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'LP05' }] })).result
  const wcs = (await execute({ 'v1.part.workCSys': [{ id: partId, offset: [-120, 20, 10] }] })).result
  const axisX = (await execute({ 'v1.part.workAxis': [{ id: partId, position: [0, 0, 0], direction: [1, 0, 0] }] })).result

  const box = (
    await execute({ 'v1.part.box': [{ id: partId, references: [wcs], length: 40, width: 20, height: 10 }] })
  ).result

  const pre = (await execute({ 'v1.part.calculateMassProperties': [{ id: partId }] })).result
  await snapshot('05-before-pattern')

  const pattern = (
    await execute({
      'v1.part.linearPattern': [
        {
          id: partId,
          targets: [box],
          dir1: { references: [axisX], distance: 20, count: 3, merged: true },
        },
      ],
    })
  ).result

  const post = (await execute({ 'v1.part.calculateMassProperties': [{ id: partId }] })).result
  await snapshot('05-after-pattern')

  return { partId, box, pattern, pre, post }
}
