// No OFB export in this release — runs on every build (postbuild).
// ofbExportRefusal is the one gate every engine command passes (client.execute).
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { ofbExportRefusal } from '../dist/client.js'

test('OFB exports are refused, everything else passes', () => {
  const refused = [
    { 'v1.common.save': [{}] },                                          // OFB is the default
    { 'v1.common.save': [{ format: 'OFB', encoding: 'base64' }] },
    { 'v1.common.save': [{ format: 'ofb', compression: 'deflate' }] },
    { 'v1.common.save': [{ file: '/tmp/model.ofb' }] },                   // format from the extension
    { 'v1.common.save': [{ format: 'OFB', url: 'https://example.com/upload' }] },
    { 'v1.assembly.exportNode': [{ id: 4 }] },                            // OFB is the default here too
    { 'v1.assembly.exportNode': [{ id: 4, format: 'OFB' }] },
  ]
  for (const task of refused) assert.match(ofbExportRefusal(task) ?? '', /OFB export is not available/, JSON.stringify(task))

  const allowed = [
    { 'v1.common.save': [{ format: 'STP', encoding: 'base64' }] },
    { 'v1.common.save': [{ format: 'STL' }] },
    { 'v1.common.save': [{ file: '/tmp/model.stp' }] },
    { 'v1.assembly.exportNode': [{ id: 4, format: 'STP' }] },
    { 'v1.common.load': [{ format: 'OFB', data: 'x' }] },                 // loading OFB stays
    { 'v1.part.box': [{ id: 4, length: 10 }] },
  ]
  for (const task of allowed) assert.equal(ofbExportRefusal(task), null, JSON.stringify(task))
})
