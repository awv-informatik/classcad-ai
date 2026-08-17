// 02 — A single template with URL-referenced OFB (the doc example shape)
function findByClass(tree, className) {
  const out = []
  for (const [id, node] of Object.entries(tree)) {
    if (node.class === className) out.push({ id, name: node.name })
  }
  return out
}

export default async function (api, { filewrite, snapshot }) {
  const payload = {
    templates: [
      {
        ident: 'Bolt_Template',
        type: 'part',
        reference: {
          location:
            'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Bolt.ofb',
          type: 'ofb',
        },
      },
    ],
    instances: [],
    constraints: [],
  }

  const r = await api.v1.assembly.from({ data: JSON.stringify(payload), format: 'JSON' })
  console.log('[02] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))

  // Examine container contents — did a part template land in PartContainer?
  filewrite(r.structure, 'structure')
  const partTemplates = findByClass(r.structure.tree, 'CC_PartReference')
  const containers = findByClass(r.structure.tree, 'CC_PartContainer')
  console.log('[02] CC_PartReference nodes:', JSON.stringify(partTemplates))
  console.log('[02] PartContainer found:', JSON.stringify(containers))

  // Also list all nodes for visibility
  const all = Object.entries(r.structure.tree).map(([id, n]) => ({ id, class: n.class, name: n.name }))
  filewrite(all, 'node-summary')

  await snapshot('template-loaded')
  return { rootId: r.result }
}
