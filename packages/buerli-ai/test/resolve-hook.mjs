export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context)
  } catch (e) {
    if (e?.code !== 'ERR_MODULE_NOT_FOUND' && e?.code !== 'ERR_UNSUPPORTED_DIR_IMPORT') throw e
    if (!specifier.startsWith('.')) throw e
    for (const candidate of [`${specifier}.js`, `${specifier}/index.js`]) {
      try {
        return await next(candidate, context)
      } catch {
        /* try the next candidate */
      }
    }
    throw e
  }
}
