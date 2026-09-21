// 07 — replay of the real PVS v2 Tub in the ORIGINAL failing order (closed shell hollowed before the seam slice),
// using the project's own native builder. Volumes are logged after every boolean step by the builder.
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const here = dirname(fileURLToPath(import.meta.url))
export default async function (api, { snapshot, filewrite }) {
  const MODEL = JSON.parse(readFileSync(join(here, '../files/model-enclosed-order.json'), 'utf8'))
  const code = readFileSync(join(here, '../files/native-under-test.js'), 'utf8')
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  try {
    const built = await new AsyncFunction('MODEL', 'OUT', 'api', code)(MODEL, join(here, '../files'), api)
    console.log('[07] build completed', JSON.stringify(built.mass))
  } catch (e) {
    console.log('[07] build stopped:', String(e.message).slice(0, 400))
  }
  await snapshot('state-at-stop', { section: { origin: [57, 19, 15], normal: [0, 1, 0] } })
  return {}
}
