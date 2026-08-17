export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'DupTest' })).result

  // Create two templates with the same name
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Widget' })).result
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Widget' })).result
  console.log('[07] tpl1 (Widget):', tpl1)
  console.log('[07] tpl2 (Widget):', tpl2)
  console.log('[07] same ID?', tpl1 === tpl2)

  // Give them different geometry so we can distinguish
  await api.v1.part.box({ id: tpl1, name: 'SmallBox', length: 20, width: 20, height: 20 })
  await api.v1.part.box({ id: tpl2, name: 'BigBox', length: 80, width: 80, height: 80 })

  // What does getPartTemplate return for duplicate names?
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const getR = await api.v1.assembly.getPartTemplate({ name: 'Widget' })
  console.log('[07] getPartTemplate(Widget) result:', JSON.stringify(getR.result))
  console.log('[07] maxLevel:', getR.maxLevel)

  // Get all templates
  const allR = await api.v1.assembly.getPartTemplate({})
  console.log('[07] all templates:', JSON.stringify(allR.result))

  // Verify they are truly different by checking mass properties
  const m1 = (await api.v1.assembly.calculateMassProperties({ id: tpl1 })).result
  const m2 = (await api.v1.assembly.calculateMassProperties({ id: tpl2 })).result
  console.log('[07] tpl1 volume:', m1.volume, '(20^3=8000)')
  console.log('[07] tpl2 volume:', m2.volume, '(80^3=512000)')

  filewrite(
    {
      tpl1, tpl2, sameId: tpl1 === tpl2,
      getByName: getR.result,
      allTemplates: allR.result,
      volumes: { tpl1: m1.volume, tpl2: m2.volume },
    },
    'duplicate-names'
  )

  return { asmId }
}
