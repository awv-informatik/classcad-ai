// A fake buerli (@buerli.io/classcad and @buerli.io/core in one) over a fake engine: what the
// browser session uses of them. Its graphic follows the database settings as ClassCAD's does:
// with doCurveTessellation off a solid's brep edges come as `lines`, and it has no `edges`.

/** Buerligons' own settings (initBuerli.ts), set on every 'connected'. */
export const APP_SETTINGS = { isGraphicEnabled: true, isCCGraphicEnabled: false, isSketchGraphicEnabled: false, doCurveTessellation: false }

const bits = settings => Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, value ? 1 : 0]))

export const engine = {
  settings: {},
  bodies: [],
  emission: { sendGraphic_Kernel: true },
  /** The commands the engine got, in order (the settings, the pulls). */
  log: [],
  /** The app (re)connects: a new engine session, the tree pulled, then the app's settings (WSClient.connect + initSettings). */
  connect() {
    this.settings = { isGraphicEnabled: 1, isCCGraphicEnabled: 1, isSketchGraphicEnabled: 1, doCurveTessellation: 1 }
    this.bodies = []
    pull()
    this.settings = bits(APP_SETTINGS)
    this.log = []
  },
  /** Another participant sets its own settings on the shared engine: nothing of it reaches the store. */
  foreign(settings) {
    this.settings = { ...this.settings, ...bits(settings) }
  },
}

const store = { structure: { tree: {} }, graphic: { containers: {} } }
export const getDrawing = () => store

function container(body) {
  const c = { id: `c${body}`, owner: body, type: 1, meshes: [{ id: 1 }] }
  const curves = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, points: [0, 0, 0, 1, 1, 1] }))
  if (engine.settings.doCurveTessellation) c.edges = curves
  else c.lines = curves
  return c
}

/** GetTree: the tree, and the whole graphic when the connection sends it. */
function pull() {
  engine.log.push('GetTree')
  store.structure = { tree: { 1: { id: 1, class: 'CC_Part', members: {} } } }
  if (engine.emission.sendGraphic_Kernel) store.graphic = { containers: Object.fromEntries(engine.bodies.map(b => [`c${b}`, container(b)])) }
}

const api = {
  common: {
    getDatabaseSettings: async () => {
      engine.log.push('getDatabaseSettings')
      return { result: { ...engine.settings } }
    },
    setDatabaseSettings: async settings => {
      engine.log.push('setDatabaseSettings')
      engine.settings = { ...engine.settings, ...bits(settings) }
      return { result: null }
    },
  },
  part: {
    create: async () => ({ result: 1 }),
    box: async () => {
      const body = 100 + engine.bodies.length
      engine.bodies.push(body)
      if (engine.emission.sendGraphic_Kernel) store.graphic = { containers: { ...store.graphic.containers, [`c${body}`]: container(body) } }
      return { result: body }
    },
  },
}
export const createApi = () => ({ v1: api })

export const BuerliCadFacade = {
  utils: {
    fetchTree: async () => pull(),
    getEmissionConfig: async () => ({ ...engine.emission }),
    setEmissionConfig: async (_id, partial) => Object.assign(engine.emission, partial),
    withEmissionConfig: async (_id, partial, fn) => {
      const previous = { ...engine.emission }
      Object.assign(engine.emission, partial)
      try {
        return await fn()
      } finally {
        Object.assign(engine.emission, previous)
      }
    },
  },
}
