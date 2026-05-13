// 03 — template + instance referenced by ident
function summarize(tree) {
  return Object.entries(tree).map(([id, n]) => ({ id, class: n.class, name: n.name }))
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
    instances: [
      { ident: 'Bolt_Instance', template: 'Bolt_Template' },
    ],
    constraints: [],
  }
  const r = await api.v1.assembly.from({ data: JSON.stringify(payload), format: 'JSON' })
  console.log('[03] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))

  filewrite(r.structure, 'structure')
  filewrite(summarize(r.structure.tree), 'node-summary')

  // Look up the instance ID via the assembly API
  const instLookup = await api.v1.assembly.getInstance({ ownerId: r.result, name: 'Bolt_Instance' })
  console.log('[03] getInstance Bolt_Instance →', instLookup.result, 'maxLevel:', instLookup.maxLevel)
  filewrite(instLookup, 'getInstance')

  await snapshot('one-instance')
  return { rootId: r.result, instId: instLookup.result }
}
