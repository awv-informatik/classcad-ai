// 06 — full nut+bolt with the corrected `CC_*` constraint types
function summarize(tree) {
  return Object.entries(tree).map(([id, n]) => ({ id, class: n.class, name: n.name }))
}

export default async function (api, { filewrite, snapshot }) {
  const payload = {
    ident: 'NutBoltAsm_Template',
    instances: [
      { ident: 'Bolt_Instance', template: 'Bolt_Template' },
      { ident: 'Nut_Instance', template: 'Nut_Template' },
    ],
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
      {
        ident: 'Nut_Template',
        type: 'part',
        reference: {
          location:
            'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Nut.ofb',
          type: 'ofb',
        },
      },
    ],
    constraints: [
      {
        type: 'CC_FastenedOriginConstraint',
        mate1: { path: ['Bolt_Instance'], csys: 'WCS_Origin', flip: 'Z', reorient: '0' },
      },
      {
        type: 'CC_FastenedConstraint',
        mate1: { path: ['Bolt_Instance'], csys: 'WCS_Nut', flip: 'Z', reorient: '0' },
        mate2: { path: ['Nut_Instance'], csys: 'WCS_Hole-Top', flip: 'Z', reorient: '0' },
      },
    ],
  }
  const r = await api.v1.assembly.from({ data: JSON.stringify(payload), format: 'JSON' })
  console.log('[06] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))
  filewrite(r.structure, 'structure')
  filewrite(summarize(r.structure.tree), 'node-summary')

  // Constraint nodes that ended up in the tree
  const constraintNodes = Object.entries(r.structure.tree)
    .filter(([_, n]) => typeof n.class === 'string' && /Constraint/i.test(n.class) && n.class !== 'CC_ConstraintSet')
    .map(([id, n]) => ({ id, class: n.class, name: n.name }))
  console.log('[06] constraint nodes:', JSON.stringify(constraintNodes))

  const boltInst = (await api.v1.assembly.getInstance({ ownerId: r.result, name: 'Bolt_Instance' })).result
  const nutInst = (await api.v1.assembly.getInstance({ ownerId: r.result, name: 'Nut_Instance' })).result

  // Spatial verification — COG (world frame) of each instance under the constraints
  const boltCog = await api.v1.assembly.calculateMassProperties({ id: boltInst })
  const nutCog = await api.v1.assembly.calculateMassProperties({ id: nutInst })
  console.log('[06] Bolt COG:', JSON.stringify(boltCog.result?.cog ?? boltCog.result))
  console.log('[06] Nut COG :', JSON.stringify(nutCog.result?.cog ?? nutCog.result))
  filewrite({ bolt: boltCog.result, nut: nutCog.result }, 'mass-props')

  await snapshot('nut-bolt-iso')
  await snapshot('nut-bolt-front', { view: 'front' })
  return { rootId: r.result, boltInst, nutInst }
}
