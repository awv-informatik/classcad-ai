// Stands fake-buerli.mjs in for @buerli.io/classcad and @buerli.io/core (as a sync hook for
// module.registerHooks, or an async one for module.register on Node 20).
const fake = new URL('./fake-buerli.mjs', import.meta.url).href

export function resolve(specifier, context, next) {
  if (specifier === '@buerli.io/classcad' || specifier === '@buerli.io/core') return { url: fake, shortCircuit: true }
  return next(specifier, context)
}
