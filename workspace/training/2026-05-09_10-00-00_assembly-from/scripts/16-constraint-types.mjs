// Test: probe constraint types (the builder reads 'type' field)
// Also try different instance field patterns
export default async function (api, { snapshot, filewrite }) {
  console.log('[16] Probing constraint types and instance patterns...')

  // Constraint type probe
  const constraintTypes = [
    'FASTENED', 'Fastened', 'fastened',
    'FASTENED_ORIGIN', 'FastenedOrigin', 'fastenedOrigin',
    'REVOLUTE', 'Revolute', 'revolute',
    'CYLINDRICAL', 'Cylindrical', 'cylindrical',
    'PLANAR', 'Planar', 'planar',
    'PARALLEL', 'Parallel', 'parallel',
    'SLIDER', 'Slider', 'slider',
    'SPHERICAL', 'Spherical', 'spherical',
    'GEAR', 'Gear', 'gear',
    'GROUP', 'Group', 'group',
    'FIXED', 'Fixed', 'fixed',
    'RIGID', 'Rigid', 'rigid',
  ]

  for (const ctype of constraintTypes) {
    await api.v1.common.clear({})
    const json = {
      templates: [],
      instances: [],
      constraints: [{ type: ctype, name: 'C1' }],
    }
    const r = await api.v1.assembly.from({ data: JSON.stringify(json), format: 'JSON' })
    const firstMsg = r.messages?.[0]?.message || ''
    if (!firstMsg.includes('Unknown constraint type')) {
      console.log(`[16] ★ '${ctype}' recognized! maxLevel:${r.maxLevel}`)
      if (r.messages?.length) {
        for (const m of r.messages) {
          console.log(`[16]   ${m.levelStr}: ${m.message.substring(0, 120)}`)
        }
      }
      filewrite({ type: ctype, result: r.result, messages: r.messages }, `ctype-${ctype}`)
    }
  }

  // Instance field probe - try many different patterns
  const instancePatterns = [
    { label: 'template-name', inst: { template: 'Box', name: 'I1' } },
    { label: 'templateName', inst: { templateName: 'Box', name: 'I1' } },
    { label: 'ident', inst: { ident: 'Box', name: 'I1' } },
    { label: 'type-product', inst: { type: 'product', name: 'I1', productId: 'Box' } },
    { label: 'type-part', inst: { type: 'part', name: 'I1' } },
    { label: 'owner-product', inst: { ownerId: 'root', productId: 'Box' } },
    { label: 'with-transformation', inst: { name: 'I1', transformation: [[0,0,0],[1,0,0],[0,1,0]] } },
    { label: 'position', inst: { name: 'I1', position: [0, 0, 0] } },
  ]

  for (const { label, inst } of instancePatterns) {
    await api.v1.common.clear({})
    const json = { templates: [], instances: [inst], constraints: [] }
    const r = await api.v1.assembly.from({ data: JSON.stringify(json), format: 'JSON' })
    if (r.messages?.length) {
      const msg = r.messages[0].message
      if (!msg.includes('Uninitialized member')) {
        console.log(`[16] ★ '${label}' different error: ${msg.substring(0, 120)}`)
        filewrite({ label, result: r.result, messages: r.messages }, `inst-${label}`)
      }
    }
  }
  console.log('[16] Done')

  return {}
}
