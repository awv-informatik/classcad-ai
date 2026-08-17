// STP file-based load — test auto-format detection from extension
import { unlinkSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StpFileTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  const tmpFile = join(tmpdir(), 'classcad-load-test.stp')
  const saveR = await api.v1.common.save({ file: tmpFile, format: 'STP' })
  console.log('[18] STP save to file:', JSON.stringify(saveR.result))

  await api.v1.common.clear({})

  // Load from .stp file without specifying format — should auto-detect
  const loadR = await api.v1.common.load({ file: tmpFile })
  console.log('[18] STP auto-format load result:', JSON.stringify(loadR.result))
  console.log('[18] STP auto-format load maxLevel:', loadR.maxLevel)

  filewrite({ result: loadR.result, maxLevel: loadR.maxLevel, messages: loadR.messages }, 'stp-file-load-response')

  await snapshot('after-stp-file-load')

  try { unlinkSync(tmpFile) } catch (e) { /* ignore */ }

  return { loadedId: loadR.result?.id }
}
