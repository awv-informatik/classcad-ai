// 15 — enumerate which constraint types the JSON parser accepts
// The source jsonAsmBuilder.CreateConstraints supports a fixed set; let's verify each.

const BOLT_URL =
  'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Bolt.ofb'
const NUT_URL =
  'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Nut.ofb'

async function tryConstraint(api, type, mate2) {
  await api.v1.common.clear({})
  const payload = {
    templates: [
      { ident: 'Bolt_T', type: 'part', reference: { location: BOLT_URL, type: 'ofb' } },
      { ident: 'Nut_T', type: 'part', reference: { location: NUT_URL, type: 'ofb' } },
    ],
    instances: [
      { ident: 'B', template: 'Bolt_T' },
      { ident: 'N', template: 'Nut_T' },
    ],
    constraints: [
      {
        type,
        mate1: { path: ['B'], csys: 'WCS_Nut', flip: 'Z', reorient: '0' },
        ...(mate2 ? { mate2: { path: ['N'], csys: 'WCS_Hole-Top', flip: 'Z', reorient: '0' } } : {}),
      },
    ],
  }
  const r = await api.v1.assembly.from({ data: JSON.stringify(payload), format: 'JSON' })
  const errs = (r.messages ?? []).filter((m) => m.level >= 51).map((m) => m.message.slice(0, 80))
  const constraintNode = Object.values(r.structure?.tree ?? {}).find(
    (n) => typeof n.class === 'string' && /Constraint/i.test(n.class) && n.class !== 'CC_ConstraintSet' && n.class !== 'CC_3DConstraintSolver',
  )
  return {
    type,
    maxLevel: r.maxLevel,
    accepted: !!constraintNode,
    constraintClass: constraintNode?.class ?? null,
    firstErr: errs[0] ?? null,
  }
}

export default async function (api, { filewrite }) {
  // Try every constraint the docs/source mentions
  const types = [
    // Implemented per JsonAssemblyBuilder.cclass
    { t: 'CC_FastenedOriginConstraint', m2: false },
    { t: 'CC_FastenedConstraint', m2: true },
    { t: 'CC_CylindricalConstraint', m2: true },
    { t: 'CC_RevoluteConstraint', m2: true },
    { t: 'CC_PlanarConstraint', m2: true },
    { t: 'CC_ParallelConstraint', m2: true },
    { t: 'CC_SliderConstraint', m2: true },
    // Likely NOT in the JSON builder (according to the source enum)
    { t: 'CC_SphericalConstraint', m2: true },
    { t: 'CC_GearConstraint', m2: true },
    { t: 'CC_GroupConstraint', m2: true },
    { t: 'CC_CircularPatternConstraint', m2: true },
  ]
  const out = []
  for (const { t, m2 } of types) {
    const r = await tryConstraint(api, t, m2)
    out.push(r)
    console.log('[15]', JSON.stringify(r))
  }
  filewrite(out, 'results')
  return out
}
