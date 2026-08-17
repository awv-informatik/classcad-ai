// Multiple copies of the same source — circular pattern around origin
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiCopy' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Small box at a radius from origin
  const boxId = (await api.v1.solid.box({
    id: eifId, length: 20, width: 10, height: 15,
    translation: [50, 0, 0]
  })).result

  // Create 5 copies at 60° intervals using rotateFirst=false (orbit pattern)
  const copies = []
  for (let i = 1; i <= 5; i++) {
    const angle = (i * Math.PI * 2) / 6  // 60° increments
    const r = await api.v1.solid.copy({
      id: eifId, target: boxId,
      rotation: [0, 0, angle],
      translation: [50, 0, 0],
      rotateFirst: false
    })
    copies.push(r.result)
    console.log(`[08] copy ${i}: id=${r.result}, angle=${(angle * 180 / Math.PI).toFixed(0)}°`)
  }

  // Add a reference cylinder at center
  await api.v1.solid.cylinder({ id: eifId, height: 15, diameter: 10 })

  filewrite({ original: boxId, copies, totalBodies: copies.length + 2 }, 'multi-copy-ids')
  await snapshot('circular-pattern')

  return { partId, eifId }
}
