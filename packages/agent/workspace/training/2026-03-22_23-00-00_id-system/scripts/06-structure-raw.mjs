// Q: What is the actual structure tree format? Dump raw after part.create.
export default async function (api) {
  const r1 = await api.v1.part.create({ name: 'TestPart' })
  console.log('[06] structure keys:', Object.keys(r1.structure || {}))
  console.log('[06] structure (truncated):', JSON.stringify(r1.structure, null, 2).substring(0, 3000))

  // Add a box and check structure again
  const boxId = (await api.v1.part.box({ id: r1.result })).result
  const r2 = await api.v1.common.getAppVersion({})
  console.log('[06] post-box structure keys:', Object.keys(r2.structure || {}))
  console.log('[06] post-box structure (truncated):', JSON.stringify(r2.structure, null, 2).substring(0, 3000))
}
