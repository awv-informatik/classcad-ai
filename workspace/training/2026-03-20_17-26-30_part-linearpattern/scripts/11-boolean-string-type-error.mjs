export default async function ({ execute }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'LP11' }] })).result
  const wcs = (await execute({ 'v1.part.workCSys': [{ id: partId, offset: [-120, 20, 10] }] })).result
  const axisX = (await execute({ 'v1.part.workAxis': [{ id: partId, direction: [1, 0, 0] }] })).result
  const box = (await execute({ 'v1.part.box': [{ id: partId, references: [wcs], length: 20, width: 10, height: 8 }] })).result

  const pattern = await execute({
    'v1.part.linearPattern': [
      {
        id: partId,
        targets: [box],
        dir1: { references: [axisX], distance: 30, count: 3, merged: 'TRUE' },
      },
    ],
  })

  return { partId, box, patternResult: pattern.result, patternMessages: pattern.messages ?? [] }
}
