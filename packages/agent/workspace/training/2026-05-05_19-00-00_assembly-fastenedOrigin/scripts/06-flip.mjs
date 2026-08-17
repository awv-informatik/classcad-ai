export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'M', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test flip values: Z (default), -Z, X, -X, Y, -Y
  const flips = ['Z', '-Z', 'X', '-X', 'Y', '-Y']
  const results = {}

  for (const flip of flips) {
    const inst = (await api.v1.assembly.instance({
      productId: tpl, ownerId: asmId, name: `F_${flip}`,
      transformation: [[200, 0, 0], [1, 0, 0], [0, 1, 0]],
    })).result

    const foR = await api.v1.assembly.fastenedOrigin({
      id: asmId, name: `FO_${flip}`,
      mate1: { path: [inst], csys: wcs, flip },
    })

    // Calculate mass for this single instance (but we have multiple now...)
    // Use getFastenedOrigin to verify it stored correctly
    const foState = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: `FO_${flip}` })).result
    console.log(`[06] flip=${flip}: result=${foR.result} maxLevel=${foR.maxLevel}`)
    results[flip] = { foId: foR.result, maxLevel: foR.maxLevel, state: foState }
  }

  filewrite(results, 'flip-results')

  // Get combined mass to see the spread
  const mass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] combined COG:', JSON.stringify(mass?.cog))
  filewrite(mass, 'combined-mass')

  await snapshot('all-flips')
  return {}
}
