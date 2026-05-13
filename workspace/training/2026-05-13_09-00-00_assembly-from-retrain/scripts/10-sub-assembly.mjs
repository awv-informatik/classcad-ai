// 10 — sub-assembly via type: "assembly". Templates of type "assembly" should
// be able to nest instances and constraints, then be instantiated in a parent.
function summarize(tree) {
  return Object.entries(tree).map(([id, n]) => ({ id, class: n.class, name: n.name }))
}

const BOLT_URL =
  'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Bolt.ofb'
const NUT_URL =
  'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Nut.ofb'

export default async function (api, { filewrite, snapshot }) {
  const payload = {
    templates: [
      {
        ident: 'Bolt_Template',
        type: 'part',
        reference: { location: BOLT_URL, type: 'ofb' },
      },
      {
        ident: 'Nut_Template',
        type: 'part',
        reference: { location: NUT_URL, type: 'ofb' },
      },
      // A SUB-ASSEMBLY template — declared inline, no reference
      {
        ident: 'NutBolt_Sub',
        type: 'assembly',
        instances: [
          { ident: 'Bolt_Inst', template: 'Bolt_Template' },
          { ident: 'Nut_Inst', template: 'Nut_Template' },
        ],
        constraints: [
          {
            type: 'CC_FastenedOriginConstraint',
            mate1: { path: ['Bolt_Inst'], csys: 'WCS_Origin', flip: 'Z', reorient: '0' },
          },
          {
            type: 'CC_FastenedConstraint',
            mate1: { path: ['Bolt_Inst'], csys: 'WCS_Nut', flip: 'Z', reorient: '0' },
            mate2: { path: ['Nut_Inst'], csys: 'WCS_Hole-Top', flip: 'Z', reorient: '0' },
          },
        ],
      },
    ],
    instances: [
      // Two copies of the sub-assembly at root
      { ident: 'NB_A', template: 'NutBolt_Sub' },
      { ident: 'NB_B', template: 'NutBolt_Sub' },
    ],
    constraints: [
      // Lock NB_A to assembly origin
      {
        type: 'CC_FastenedOriginConstraint',
        mate1: { path: ['NB_A', 'Bolt_Inst'], csys: 'WCS_Origin', flip: 'Z', reorient: '0' },
      },
      // Lock NB_B to origin too (overlaps NB_A — fine, this is just a structural test)
      {
        type: 'CC_FastenedOriginConstraint',
        mate1: { path: ['NB_B', 'Bolt_Inst'], csys: 'WCS_Origin', flip: 'Z', reorient: '0' },
      },
    ],
  }
  const r = await api.v1.assembly.from({ data: JSON.stringify(payload), format: 'JSON' })
  console.log('[10] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] errors:', JSON.stringify((r.messages ?? []).filter((m) => m.level >= 51)))
  filewrite(r.structure, 'structure')
  filewrite(summarize(r.structure.tree), 'node-summary')

  // Inspect nested instances under the root via getInstance
  const allRoot = await api.v1.assembly.getInstance({ ownerId: r.result })
  console.log('[10] root instances:', JSON.stringify(allRoot.result))

  // Try to find the bolt inside NB_A
  const nbAId = (await api.v1.assembly.getInstance({ ownerId: r.result, name: 'NB_A' })).result
  console.log('[10] NB_A id:', nbAId)
  if (nbAId) {
    const inner = await api.v1.assembly.getInstance({ ownerId: nbAId })
    console.log('[10] NB_A children:', JSON.stringify(inner.result))
  }

  await snapshot('two-subassemblies')
  return { rootId: r.result, nbAId }
}
