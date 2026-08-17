export default async function (api, { snapshot, filewrite }) {
  // Test: using a solid (not sheet) as the tool — what happens?
  const partId = (await api.v1.part.create({ name: 'SolidTool' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box', length: 80, width: 60, height: 50,
  })).result
  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Cyl', radius: 20, height: 60, translation: [40, 30, 0],
  })).result

  // Use the cylinder (solid!) as the tool — should fail
  const r = await api.v1.part.sliceBySheet({
    id: partId,
    target: boxId,
    tool: cylId,
  })
  console.log('[14] solid tool: result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[14] msgs:', JSON.stringify(r.messages?.map(m => m.message)))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'solid-tool-response')

  return { partId }
}
