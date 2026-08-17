// Verify: does OFB save/restore chordHeightTol and angleTol?
// The getDatabaseSettings doc claims yes. Script 08 suggests no. This script isolates the question.
export default async function (api, { filewrite }) {
  // Create minimal geometry
  const partId = (await api.v1.part.create({ name: 'SaveVerify' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20 })

  // Set recognizable non-default values
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.77, angleTol: 33 })
  const preSave = (await api.v1.common.getDatabaseSettings()).result
  console.log('[09] pre-save chord:', preSave.chordHeightTol, 'angle:', preSave.angleTol)

  // Save
  const saveR = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result

  // Set to different recognizable non-defaults (NOT defaults) so we can distinguish
  // "load restored saved values" from "load did nothing"
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 2.22, angleTol: 66 })
  const preLoad = (await api.v1.common.getDatabaseSettings()).result
  console.log('[09] pre-load chord:', preLoad.chordHeightTol, 'angle:', preLoad.angleTol)

  // Load
  await api.v1.common.load({ data: saveR.content, format: 'OFB', encoding: 'base64' })
  const postLoad = (await api.v1.common.getDatabaseSettings()).result
  console.log('[09] post-load chord:', postLoad.chordHeightTol, 'angle:', postLoad.angleTol)

  // Determine behavior
  if (postLoad.chordHeightTol === 0.77 && postLoad.angleTol === 33) {
    console.log('[09] RESULT: load() RESTORED saved values (0.77, 33)')
  } else if (postLoad.chordHeightTol === 2.22 && postLoad.angleTol === 66) {
    console.log('[09] RESULT: load() DID NOT CHANGE values (stayed at 2.22, 66)')
  } else {
    console.log('[09] RESULT: load() set UNEXPECTED values:', postLoad.chordHeightTol, postLoad.angleTol)
  }

  // Also check all other fields
  console.log('[09] full post-load:', JSON.stringify(postLoad))

  filewrite({ preSave, preLoad, postLoad }, 'save-load-verify')
  return {}
}
