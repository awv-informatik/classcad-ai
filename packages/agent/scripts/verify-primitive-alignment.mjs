// Regression test for primitive alignment conventions.
//
// Probes all four solid.* and all four part.* primitives in their default
// (un-translated) position and reports actual vertex / COG. Lets the operator
// see whether the alignment matches the docs.
//
// History: the older docs claimed solid.box was corner-aligned and
// solid.cylinder spanned z=0..h; both were wrong (verified 2026-05-01) — they
// are fully centered. But part.box vs solid.box may use *different*
// conventions, which is the failure mode this script is designed to surface.
//
// Run:
//   node scripts/run.mjs scripts/verify-primitive-alignment.mjs --outdir /tmp/verify

async function vertex0(api, featureId) {
  const idR = await api.v1.part.getBrepGeometryByIndex({ id: featureId, pointIndex: 0 })
  if (idR.result == null) return null
  const posR = await api.v1.part.getGeometryPositions({ elems: [idR.result] })
  return posR.result[0].positions[0]
}

async function cog(api, partId) {
  const r = await api.v1.part.calculateMassProperties({ id: partId })
  if (!r.result) return null
  return r.result.cog
}

async function fresh(api) {
  await api.v1.common.clear({})
}

const fmt = (p) => p ? `(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)})` : 'null'

export default async function (api, { filewrite }) {
  const findings = []

  async function probe(name, label, setup, dims) {
    await fresh(api)
    const partId = (await api.v1.part.create({ name: label })).result
    const featureId = await setup(partId)
    const v = await vertex0(api, featureId)
    const c = await cog(api, partId)
    findings.push({ primitive: name, dims, vertex0: v, cog: c })
    console.log(`${name.padEnd(16)} dims=${JSON.stringify(dims).padEnd(40)} vtx0=${fmt(v).padEnd(28)} cog=${fmt(c)}`)
  }

  // solid.* — direct geometry inside an entity injection
  await probe('solid.box', 'BoxTest', async (pid) => {
    const eif = (await api.v1.part.entityInjection({ id: pid })).result
    await api.v1.solid.box({ id: eif, length: 100, width: 80, height: 60 })
    return eif
  }, { length: 100, width: 80, height: 60 })

  await probe('solid.cylinder', 'CylTest', async (pid) => {
    const eif = (await api.v1.part.entityInjection({ id: pid })).result
    await api.v1.solid.cylinder({ id: eif, diameter: 30, height: 100 })
    return eif
  }, { diameter: 30, height: 100 })

  await probe('solid.cone', 'ConeTest', async (pid) => {
    const eif = (await api.v1.part.entityInjection({ id: pid })).result
    await api.v1.solid.cone({ id: eif, bDiameter: 40, tDiameter: 40, height: 80 })
    return eif
  }, { bDiameter: 40, tDiameter: 40, height: 80 })

  await probe('solid.sphere', 'SphereTest', async (pid) => {
    const eif = (await api.v1.part.entityInjection({ id: pid })).result
    await api.v1.solid.sphere({ id: eif, radius: 25 })
    return eif
  }, { radius: 25 })

  // part.* — parametric features
  await probe('part.box', 'PartBoxTest', async (pid) => {
    return (await api.v1.part.box({ id: pid, length: 100, width: 80, height: 60 })).result
  }, { length: 100, width: 80, height: 60 })

  await probe('part.cylinder', 'PartCylTest', async (pid) => {
    return (await api.v1.part.cylinder({ id: pid, diameter: 30, height: 100 })).result
  }, { diameter: 30, height: 100 })

  await probe('part.cone', 'PartConeTest', async (pid) => {
    return (await api.v1.part.cone({ id: pid, bDiameter: 40, tDiameter: 40, height: 80 })).result
  }, { bDiameter: 40, tDiameter: 40, height: 80 })

  await probe('part.sphere', 'PartSphereTest', async (pid) => {
    return (await api.v1.part.sphere({ id: pid, radius: 25 })).result
  }, { radius: 25 })

  filewrite(findings, 'findings')
  return { findings }
}
