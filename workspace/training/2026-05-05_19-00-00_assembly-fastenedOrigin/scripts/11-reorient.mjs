export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  // Non-square box so rotation is visible
  await api.v1.part.box({ id: tpl, name: 'B', length: 60, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'M', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test each reorient value separately
  const reorients = ['0', '90', '180', '270']
  const results = {}

  for (const reorient of reorients) {
    const inst = (await api.v1.assembly.instance({
      productId: tpl, ownerId: asmId, name: `R_${reorient}`,
      transformation: [[200, 0, 0], [1, 0, 0], [0, 1, 0]],
    })).result

    await api.v1.assembly.fastenedOrigin({
      id: asmId, name: `FO_R${reorient}`,
      mate1: { path: [inst], csys: wcs, reorient },
      // Separate them with Y offset so they don't overlap
      yOffset: parseInt(reorient),
    })
  }

  // Can't easily get per-instance mass since calculateMassProperties(instanceId) materializes.
  // Instead, get the getFastenedOrigin for each and rely on the snapshot to show rotation.
  for (const reorient of reorients) {
    const state = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: `FO_R${reorient}` })).result
    console.log(`[11] reorient=${reorient}: stored=${state?.mate1?.reorient}`)
    results[reorient] = state
  }

  filewrite(results, 'reorient-results')
  await snapshot('all-reorients')
  await snapshot('all-reorients-top', { view: 'top' })

  return {}
}
