// Inspect the structure and graphic fields on an empty drawing
export default async function (api, { filewrite }) {
  const r = await api.v1.common.getAppVersion({})

  console.log('[05] structure type:', typeof r.structure)
  console.log('[05] structure is null:', r.structure === null)
  console.log('[05] graphic type:', typeof r.graphic)
  console.log('[05] graphic is null:', r.graphic === null)

  if (r.structure !== null && typeof r.structure === 'object') {
    console.log('[05] structure keys:', Object.keys(r.structure).join(', '))
    filewrite(r.structure, 'structure')
  }

  if (r.graphic !== null && typeof r.graphic === 'object') {
    console.log('[05] graphic keys:', Object.keys(r.graphic).join(', '))
    filewrite(r.graphic, 'graphic')
  }

  return { structureNull: r.structure === null, graphicNull: r.graphic === null }
}
