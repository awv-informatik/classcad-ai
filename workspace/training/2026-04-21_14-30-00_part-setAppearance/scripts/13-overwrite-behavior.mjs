export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OverwriteTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  // Step 1: Set color RED + transparency 0.3
  const r1 = await api.v1.part.setAppearance({ target: boxId, color: [255, 0, 0], transparency: 0.3 })
  console.log('[13] initial set:', r1.maxLevel)

  // Step 2: Set only color to GREEN (no transparency param)
  // Question: does the previous transparency 0.3 persist, or is it reset to default?
  const r2 = await api.v1.part.setAppearance({ target: boxId, color: [0, 255, 0] })
  console.log('[13] color-only overwrite:', r2.maxLevel)

  // Step 3: Set only transparency to 0.8 (no color param)
  // Question: does the green color persist, or is it reset?
  const r3 = await api.v1.part.setAppearance({ target: boxId, transparency: 0.8 })
  console.log('[13] transparency-only overwrite:', r3.maxLevel)

  // Step 4: Overwrite with completely new color + transparency
  const r4 = await api.v1.part.setAppearance({ target: boxId, color: [0, 0, 255], transparency: 0.1 })
  console.log('[13] full overwrite:', r4.maxLevel)

  // Step 5: Set faceting only — does it preserve color from step 4?
  const r5 = await api.v1.part.setAppearance({ target: boxId, chordHeightTol: 0.5 })
  console.log('[13] faceting-only:', r5.maxLevel)

  filewrite({
    initial: { maxLevel: r1.maxLevel, msgs: r1.messages },
    colorOnly: { maxLevel: r2.maxLevel, msgs: r2.messages },
    transpOnly: { maxLevel: r3.maxLevel, msgs: r3.messages },
    fullOverwrite: { maxLevel: r4.maxLevel, msgs: r4.messages },
    facetingOnly: { maxLevel: r5.maxLevel, msgs: r5.messages },
  }, 'overwrite-results')

  return { partId }
}
