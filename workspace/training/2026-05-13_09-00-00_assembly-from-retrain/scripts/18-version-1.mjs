// 18 — version: 1 — bare-name constraints + Box/WorkCSys (matches upstream doc)
function summarize(tree) {
  return Object.entries(tree).map(([id, n]) => ({ id, class: n.class, name: n.name }))
}

const BOLT_URL =
  'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Bolt.ofb'
const NUT_URL =
  'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Nut.ofb'

export default async function (api, { filewrite, snapshot }) {
  // Upstream doc's exact example, with version: 1 added
  const payload = {
    version: 1,
    nameIfRoot: 'NutBoltAsm_Template',
    instances: [
      { ident: 'Bolt_Instance', template: 'Bolt_Template' },
      { ident: 'Nut_Instance', template: 'Nut_Template' },
    ],
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
    ],
    constraints: [
      {
        type: 'FastenedOriginConstraint',  // <-- bare, no CC_ prefix
        mate1: { path: ['Bolt_Instance'], csys: 'WCS_Origin', flip: 'Z', reorient: '0' },
      },
      {
        type: 'FastenedConstraint',
        mate1: { path: ['Bolt_Instance'], csys: 'WCS_Nut', flip: 'Z', reorient: '0' },
        mate2: { path: ['Nut_Instance'], csys: 'WCS_Hole-Top', flip: 'Z', reorient: '0' },
      },
    ],
  }
  const r = await api.v1.assembly.from({ data: JSON.stringify(payload), format: 'JSON' })
  console.log('[18] maxLevel:', r.maxLevel)
  console.log('[18] errors:', JSON.stringify((r.messages ?? []).filter((m) => m.level >= 51)))
  filewrite(summarize(r.structure.tree), 'node-summary')

  const constraints = Object.values(r.structure.tree).filter(
    (n) => typeof n.class === 'string' && /Constraint/i.test(n.class) && n.class !== 'CC_ConstraintSet' && n.class !== 'CC_3DConstraintSolver',
  )
  console.log('[18] constraints:', JSON.stringify(constraints.map((c) => ({ class: c.class, name: c.name }))))

  // Spatial verification (same as the v0 test in script 06)
  const boltInst = (await api.v1.assembly.getInstance({ ownerId: r.result, name: 'Bolt_Instance' })).result
  const nutInst = (await api.v1.assembly.getInstance({ ownerId: r.result, name: 'Nut_Instance' })).result
  const boltCog = await api.v1.assembly.calculateMassProperties({ id: boltInst })
  const nutCog = await api.v1.assembly.calculateMassProperties({ id: nutInst })
  console.log('[18] Bolt COG:', JSON.stringify(boltCog.result?.cog ?? boltCog.result))
  console.log('[18] Nut COG :', JSON.stringify(nutCog.result?.cog ?? nutCog.result))

  await snapshot('v1-iso')
  return {}
}
