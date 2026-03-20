export default async function ({ execute }, { snapshot }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'LP10' }] })).result
  const wcsA = (await execute({ 'v1.part.workCSys': [{ id: partId, offset: [-140, 20, 10] }] })).result
  const wcsB = (await execute({ 'v1.part.workCSys': [{ id: partId, offset: [-140, 50, 10] }] })).result
  const axisX = (await execute({ 'v1.part.workAxis': [{ id: partId, direction: [1, 0, 0] }] })).result

  const boxA = (await execute({ 'v1.part.box': [{ id: partId, references: [wcsA], length: 20, width: 10, height: 8 }] })).result
  const boxB = (await execute({ 'v1.part.box': [{ id: partId, references: [wcsB], length: 20, width: 10, height: 8 }] })).result

  const before = (await execute({ 'v1.part.calculateMassProperties': [{ id: partId }] })).result
  await snapshot('10-before-pattern')

  const pattern = (
    await execute({
      'v1.part.linearPattern': [
        { id: partId, targets: [boxA, boxB], dir1: { references: [axisX], distance: 40, count: 3 } },
      ],
    })
  ).result

  const after = (await execute({ 'v1.part.calculateMassProperties': [{ id: partId }] })).result
  await snapshot('10-after-pattern')

  return { partId, boxA, boxB, pattern, before, after }
}
