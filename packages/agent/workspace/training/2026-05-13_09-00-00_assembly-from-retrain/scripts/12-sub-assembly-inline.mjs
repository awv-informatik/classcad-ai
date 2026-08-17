// 12 — sub-assembly via `assembly: {...}` inline (the format the source uses)
function summarize(tree) {
  return Object.entries(tree).map(([id, n]) => ({ id, class: n.class, name: n.name }))
}

const BOLT_URL =
  'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Bolt.ofb'
const NUT_URL =
  'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Nut.ofb'

export default async function (api, { filewrite, snapshot }) {
  const payload = {
    nameIfRoot: 'TopAssembly',
    templates: [
      { ident: 'Bolt_T', type: 'part', reference: { location: BOLT_URL, type: 'ofb' } },
      { ident: 'Nut_T', type: 'part', reference: { location: NUT_URL, type: 'ofb' } },
      // Sub-assembly via INLINE `assembly` field
      {
        ident: 'NutBolt_Sub',
        type: 'assembly',
        assembly: {
          templates: [],  // sub doesn't add new templates — reuses parent's
          instances: [
            { ident: 'Bolt_Inst', template: 'Bolt_T' },
            { ident: 'Nut_Inst', template: 'Nut_T' },
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
      },
    ],
    instances: [
      { ident: 'NB1', template: 'NutBolt_Sub' },
      { ident: 'NB2', template: 'NutBolt_Sub', transform: '[[100, 0, 0], [1, 0, 0], [0, 1, 0]]' },
    ],
    constraints: [],
  }

  const r = await api.v1.assembly.from({ data: JSON.stringify(payload), format: 'JSON' })
  console.log('[12] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] errors:', JSON.stringify((r.messages ?? []).filter((m) => m.level >= 51)))
  filewrite(r.structure, 'structure')
  filewrite(summarize(r.structure.tree), 'node-summary')

  // Drill into the sub-assembly: get NB1 and its children
  const nb1 = (await api.v1.assembly.getInstance({ ownerId: r.result, name: 'NB1' })).result
  console.log('[12] NB1 id:', nb1)
  if (nb1) {
    const nb1Kids = await api.v1.assembly.getInstance({ ownerId: nb1 })
    console.log('[12] NB1 children:', JSON.stringify(nb1Kids.result))
    // COG of the sub-assembly instance
    const cog = await api.v1.assembly.calculateMassProperties({ id: nb1 })
    console.log('[12] NB1 COG:', JSON.stringify(cog.result?.cog ?? cog.result))
  }
  const nb2 = (await api.v1.assembly.getInstance({ ownerId: r.result, name: 'NB2' })).result
  if (nb2) {
    const cog = await api.v1.assembly.calculateMassProperties({ id: nb2 })
    console.log('[12] NB2 COG (should be offset by ~100 in X):', JSON.stringify(cog.result?.cog ?? cog.result))
  }

  await snapshot('two-sub-asm-iso')
  await snapshot('two-sub-asm-front', { view: 'front' })
  return { rootId: r.result, nb1, nb2 }
}
