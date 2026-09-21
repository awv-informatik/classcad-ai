// dist is built for bundlers (extensionless relative imports). Let Node resolve them.
import * as nodeModule from 'node:module'

const candidates = (specifier) => [`${specifier}.js`, `${specifier}/index.js`]
const retryable = (e) => e?.code === 'ERR_MODULE_NOT_FOUND' || e?.code === 'ERR_UNSUPPORTED_DIR_IMPORT'

if (typeof nodeModule.registerHooks === 'function') {
  nodeModule.registerHooks({
    resolve(specifier, context, next) {
      try {
        return next(specifier, context)
      } catch (e) {
        if (!retryable(e) || !specifier.startsWith('.')) throw e
        for (const c of candidates(specifier)) {
          try {
            return next(c, context)
          } catch {
            /* try the next candidate */
          }
        }
        throw e
      }
    },
  })
} else {
  nodeModule.register('./resolve-hook.mjs', import.meta.url) // Node 20
}
