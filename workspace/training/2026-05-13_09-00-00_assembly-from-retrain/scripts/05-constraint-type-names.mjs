// 05 — probe constraint type strings. Try with/without CC_ prefix, with/without Constraint suffix.
// Issue a single-template-instance assembly, vary only the constraint `type`.

const TEMPLATES_AND_INSTANCES = {
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
}

async function tryType(api, typeStr) {
  await api.v1.common.clear({})
  const payload = {
    ...TEMPLATES_AND_INSTANCES,
    constraints: [
      {
        type: typeStr,
        mate1: {
          path: ['Bolt_Instance'],
          csys: 'WCS_Origin',
          flip: 'Z',
          reorient: '0',
        },
      },
    ],
  }
  const r = await api.v1.assembly.from({ data: JSON.stringify(payload), format: 'JSON' })
  const errs = (r.messages ?? []).filter((m) => m.level >= 51).map((m) => m.message)
  // detect whether any constraint object exists in the result
  const nodes = Object.values(r.structure?.tree ?? {})
  const constraintNode = nodes.find((n) => typeof n.class === 'string' && n.class.includes('Constraint') && n.class !== 'CC_ConstraintSet')
  return { typeStr, maxLevel: r.maxLevel, errs, constraintCreated: !!constraintNode, constraintClass: constraintNode?.class ?? null }
}

export default async function (api, { filewrite }) {
  const candidates = [
    'FastenedOriginConstraint',
    'CC_FastenedOriginConstraint',
    'FastenedOrigin',
    'CC_FastenedOrigin',
    'FASTENED_ORIGIN',
    'fastenedOrigin',
  ]
  const out = []
  for (const t of candidates) {
    const r = await tryType(api, t)
    out.push(r)
    console.log('[05]', JSON.stringify(r))
  }
  filewrite(out, 'results')
  return out
}
