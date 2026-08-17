// 04 — the canonical example from the upstream doc: nut + bolt assembled by
// FastenedOrigin (Bolt @ origin) + Fastened (Nut to Bolt's WCS_Nut).
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
        type: 'FastenedOriginConstraint',
        mate1: {
          path: ['Bolt_Instance'],
          csys: 'WCS_Origin',
          flip: 'Z',
          reorient: '0',
        },
      },
      {
        type: 'FastenedConstraint',
        mate1: {
          path: ['Bolt_Instance'],
          csys: 'WCS_Nut',
          flip: 'Z',
          reorient: '0',
        },
        mate2: {
          path: ['Nut_Instance'],
          csys: 'WCS_Hole-Top',
          flip: 'Z',
          reorient: '0',
        },
      },
    ],
  }

  const r = await api.v1.assembly.from({ data: JSON.stringify(payload), format: 'JSON' })
  console.log('[04] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))

  filewrite(r.structure, 'structure')
  filewrite(summarize(r.structure.tree), 'node-summary')

  const boltInst = (await api.v1.assembly.getInstance({ ownerId: r.result, name: 'Bolt_Instance' })).result
  const nutInst = (await api.v1.assembly.getInstance({ ownerId: r.result, name: 'Nut_Instance' })).result
  console.log('[04] Bolt_Instance id:', boltInst, 'Nut_Instance id:', nutInst)

  // Numeric verification — COG of each instance in world frame
  const boltCog = await api.v1.assembly.calculateMassProperties({ id: boltInst })
  const nutCog = await api.v1.assembly.calculateMassProperties({ id: nutInst })
  console.log('[04] Bolt COG:', JSON.stringify(boltCog.result?.cog ?? boltCog.result))
  console.log('[04] Nut COG :', JSON.stringify(nutCog.result?.cog ?? nutCog.result))
  filewrite({ bolt: boltCog.result, nut: nutCog.result }, 'mass-props')

  await snapshot('nut-bolt-iso')
  await snapshot('nut-bolt-front', { view: 'front' })
  await snapshot('nut-bolt-right', { view: 'right' })
  return { rootId: r.result, boltInst, nutInst }
}
