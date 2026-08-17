export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvalidType' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })
  await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT'] })

  // Invalid type string
  const r1 = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['BOGUS'] })
  console.log('[05] invalid type result:', JSON.stringify(r1.result))
  console.log('[05] invalid type maxLevel:', r1.maxLevel)
  console.log('[05] invalid type messages:', JSON.stringify(r1.messages))

  // Mix valid + invalid
  const r2 = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'BOGUS'] })
  console.log('[05] mixed valid+invalid result:', JSON.stringify(r2.result))
  console.log('[05] mixed valid+invalid maxLevel:', r2.maxLevel)
  console.log('[05] mixed valid+invalid messages:', JSON.stringify(r2.messages))

  filewrite({
    invalidOnly: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    mixed: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
  }, 'invalid-type')

  return { partId }
}
