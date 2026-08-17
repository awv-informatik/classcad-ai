// Test loading from a file on disk (save to file, then load from file)
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FileLoadTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save to a temp file
  const tmpFile = join(tmpdir(), 'classcad-load-test.ofb')
  const saveR = await api.v1.common.save({ file: tmpFile, format: 'OFB' })
  console.log('[16] Save to file result:', JSON.stringify(saveR.result))
  console.log('[16] File exists:', existsSync(tmpFile))

  // Clear and load from file
  await api.v1.common.clear({})
  const loadR = await api.v1.common.load({ file: tmpFile, format: 'OFB' })
  console.log('[16] Load from file result:', JSON.stringify(loadR.result))
  console.log('[16] Load from file maxLevel:', loadR.maxLevel)
  console.log('[16] Load messages:', JSON.stringify(loadR.messages))

  filewrite({ result: loadR.result, maxLevel: loadR.maxLevel, messages: loadR.messages }, 'file-load-response')

  await snapshot('after-file-load')

  // Also test: load from file WITHOUT specifying format (should auto-detect from extension)
  await api.v1.common.clear({})
  const loadR2 = await api.v1.common.load({ file: tmpFile })
  console.log('[16] Auto-format load result:', JSON.stringify(loadR2.result), 'maxLevel:', loadR2.maxLevel)

  // Cleanup
  try { unlinkSync(tmpFile) } catch (e) { /* ignore */ }

  return { loadedId: loadR.result?.id }
}
