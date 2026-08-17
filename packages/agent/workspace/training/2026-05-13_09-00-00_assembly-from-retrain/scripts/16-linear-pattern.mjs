// 16 — CC_LinearPatternConstraint via from() — the only one not in script 15
// Needs `instances` array on the constraint (pattern target) plus mate1 (axis) and optional mate2.
const BOLT_URL =
  'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Bolt.ofb'

export default async function (api, { filewrite }) {
  const payload = {
    templates: [
      { ident: 'Bolt_T', type: 'part', reference: { location: BOLT_URL, type: 'ofb' } },
    ],
    instances: [{ ident: 'B', template: 'Bolt_T' }],
    constraints: [
      {
        type: 'CC_FastenedOriginConstraint',
        mate1: { path: ['B'], csys: 'WCS_Origin', flip: 'Z', reorient: '0' },
      },
      {
        type: 'CC_LinearPatternConstraint',
        instances: ['B'],
        mate1: { path: ['B'], csys: 'WCS_Origin', flip: 'Z', reorient: '0' },
        count1: 3,
        distance1: 50,
      },
    ],
  }
  const r = await api.v1.assembly.from({ data: JSON.stringify(payload), format: 'JSON' })
  console.log('[16] maxLevel:', r.maxLevel)
  console.log('[16] errors:', JSON.stringify((r.messages ?? []).filter((m) => m.level >= 51)))
  const constraints = Object.values(r.structure.tree).filter((n) => typeof n.class === 'string' && /Constraint/i.test(n.class) && n.class !== 'CC_ConstraintSet' && n.class !== 'CC_3DConstraintSolver')
  console.log('[16] constraint nodes:', JSON.stringify(constraints.map((n) => ({ class: n.class, name: n.name }))))
  filewrite(r.structure, 'structure')
  return {}
}
