// 08 — Explore the `structure` field in the envelope
// It's not documented in the API docs — what is it, when does it change?

export default async function ({ execute }) {
  // Before any geometry
  const before = await execute({ 'v1.common.getAppVersion': [{}] })
  console.log('[structure] empty drawing:', JSON.stringify(before.structure, null, 2))

  // After creating a part
  const part = await execute({ 'v1.part.create': [{ name: 'StructTest' }] })
  console.log('[structure] after part.create:', JSON.stringify(part.structure, null, 2))

  // After creating a sketch
  const sk = await execute({ 'v1.sketch.create': [{ id: part.result }] })
  console.log('[structure] after sketch.create:', JSON.stringify(sk.structure, null, 2))

  // graphic field
  console.log('[graphic] after sketch.create:', JSON.stringify(sk.graphic)?.slice(0, 200))

  return {}
}
