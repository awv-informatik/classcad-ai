// Real-world: parametric electronics enclosure with wall thickness, clearances
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Enclosure' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      // PCB dimensions
      { name: 'pcbLength', value: 100 },
      { name: 'pcbWidth', value: 60 },
      { name: 'pcbThickness', value: 1.6 },
      { name: 'componentHeight', value: 15 },
      // Enclosure params
      { name: 'wallThickness', value: 2 },
      { name: 'clearance', value: 1.5 },
      { name: 'lipHeight', value: 3 },
      // Derived: inner cavity
      { name: 'cavityLength', value: 'pcbLength + 2 * clearance' },
      { name: 'cavityWidth', value: 'pcbWidth + 2 * clearance' },
      { name: 'cavityHeight', value: 'pcbThickness + componentHeight + clearance' },
      // Derived: outer shell
      { name: 'outerLength', value: 'cavityLength + 2 * wallThickness' },
      { name: 'outerWidth', value: 'cavityWidth + 2 * wallThickness' },
      { name: 'outerHeight', value: 'cavityHeight + wallThickness + lipHeight' },
      // Standoff positions (inset from PCB corners)
      { name: 'standoffInset', value: 5 },
      { name: 'standoffDiam', value: 5 },
      { name: 'standoffHoleDiam', value: 2.5 },
      { name: 'standoffX', value: 'wallThickness + clearance + standoffInset' },
      { name: 'standoffY', value: 'wallThickness + clearance + standoffInset' },
    ],
  })

  // Build the outer box and cavity
  const outerBoxId = (await api.v1.part.box({
    id: partId,
    name: 'OuterShell',
    length: '@expr.outerLength',
    width: '@expr.outerWidth',
    height: '@expr.outerHeight',
  })).result

  await snapshot('outer-shell')

  const names = ['pcbLength', 'pcbWidth', 'cavityLength', 'cavityWidth', 'cavityHeight',
    'outerLength', 'outerWidth', 'outerHeight', 'standoffX', 'standoffY']
  for (const name of names) {
    const r = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[19] ${name} = ${r.result.value.toFixed(2)}`)
  }

  return { partId }
}
