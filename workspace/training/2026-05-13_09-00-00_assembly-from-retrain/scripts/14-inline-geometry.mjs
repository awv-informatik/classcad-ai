// 14 — template `geometry[]` array — inline primitive creation (CC_Box, CC_WorkCSys)
function findByClass(tree, cls) {
  return Object.entries(tree).filter(([_, n]) => n.class === cls).map(([id, n]) => ({ id, name: n.name }))
}

export default async function (api, { filewrite, snapshot }) {
  const payload = {
    templates: [
      {
        ident: 'BoxPart',
        type: 'part',
        geometry: [
          { type: 'CC_Box', ident: 'MainBox', width: 50, length: 80, height: 30 },
          {
            type: 'CC_WorkCSys',
            ident: 'TopMate',
            inverted: 0,
            transform: '[[0, 0, 30], [1, 0, 0], [0, 1, 0]]',
          },
        ],
      },
    ],
    instances: [{ ident: 'B', template: 'BoxPart' }],
    constraints: [],
  }
  const r = await api.v1.assembly.from({ data: JSON.stringify(payload), format: 'JSON' })
  console.log('[14] maxLevel:', r.maxLevel, 'errs:', JSON.stringify((r.messages ?? []).filter((m) => m.level >= 51)))
  filewrite(r.structure, 'structure')
  console.log('[14] CC_Box nodes:', JSON.stringify(findByClass(r.structure.tree, 'CC_Box')))
  console.log('[14] CC_WorkCSys nodes:', JSON.stringify(findByClass(r.structure.tree, 'CC_WorkCSys')))
  await snapshot('inline-box')
  return {}
}
