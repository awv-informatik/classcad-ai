// 11 — `nameIfRoot` at top level, and instance `transform` (STRING expression evaluated server-side)
function findRoot(tree) {
  return Object.values(tree).find((n) => n.class === 'CC_AssemblyRoot')
}

const BOLT_URL =
  'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Bolt.ofb'

export default async function (api, { filewrite, snapshot }) {
  // A: nameIfRoot — does the root get this name?
  const a = await api.v1.assembly.from({
    data: JSON.stringify({
      nameIfRoot: 'MyRootAsm',
      templates: [],
      instances: [],
      constraints: [],
    }),
    format: 'JSON',
  })
  const aRoot = findRoot(a.structure.tree)
  console.log('[11 A] root name:', aRoot?.name, 'maxLevel:', a.maxLevel)

  await api.v1.common.clear({})

  // B: instance `transform` as a string expression matching the
  // assembly.instance({ transformation: ... }) input shape
  // (a 3-row matrix [origin, xDir, yDir])
  const transformExpr = '[[50, 30, 10], [1, 0, 0], [0, 1, 0]]'
  const b = await api.v1.assembly.from({
    data: JSON.stringify({
      templates: [
        { ident: 'Bolt_T', type: 'part', reference: { location: BOLT_URL, type: 'ofb' } },
      ],
      instances: [
        { ident: 'B', template: 'Bolt_T', transform: transformExpr },
      ],
      constraints: [],
    }),
    format: 'JSON',
  })
  console.log('[11 B] transform-string maxLevel:', b.maxLevel)
  const bInst = (await api.v1.assembly.getInstance({ ownerId: b.result, name: 'B' })).result
  const bCog = await api.v1.assembly.calculateMassProperties({ id: bInst })
  console.log('[11 B] Bolt instance COG:', JSON.stringify(bCog.result?.cog ?? bCog.result))
  filewrite(b.structure, 'B-structure')

  await api.v1.common.clear({})

  // C: `transformation` as a matrix DIRECTLY (not a string) — should be ignored (wrong field name)
  const c = await api.v1.assembly.from({
    data: JSON.stringify({
      templates: [
        { ident: 'Bolt_T', type: 'part', reference: { location: BOLT_URL, type: 'ofb' } },
      ],
      instances: [
        { ident: 'B', template: 'Bolt_T', transformation: [[200, 0, 0], [1, 0, 0], [0, 1, 0]] },
      ],
      constraints: [],
    }),
    format: 'JSON',
  })
  console.log('[11 C] transformation-field-as-matrix maxLevel:', c.maxLevel)
  const cInst = (await api.v1.assembly.getInstance({ ownerId: c.result, name: 'B' })).result
  const cCog = await api.v1.assembly.calculateMassProperties({ id: cInst })
  console.log('[11 C] Bolt instance COG (transformation ignored?):', JSON.stringify(cCog.result?.cog ?? cCog.result))

  await snapshot('with-transform')
  filewrite({ a: a.messages, b: b.messages, c: c.messages }, 'messages')
  return {}
}
