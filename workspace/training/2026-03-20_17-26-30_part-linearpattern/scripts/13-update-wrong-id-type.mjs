export default async function ({ execute }) {
  await execute({ 'v1.common.clear': [{}] })

  const partId = (await execute({ 'v1.part.create': [{ name: 'LP13' }] })).result
  const axisX = (await execute({ 'v1.part.workAxis': [{ id: partId, direction: [1, 0, 0] }] })).result
  const box = (await execute({ 'v1.part.box': [{ id: partId, length: 20, width: 10, height: 8 }] })).result
  const pattern = (
    await execute({ 'v1.part.linearPattern': [{ id: partId, targets: [box], dir1: { references: [axisX], distance: 30, count: 3 } }] })
  ).result

  // Intentional misuse: pass partId instead of linearPattern feature id
  const update = await execute({
    'v1.part.updateLinearPattern': [{ id: partId, dir1: { distance: 50 } }],
  })

  return { partId, pattern, updateResult: update.result, updateMessages: update.messages ?? [] }
}
