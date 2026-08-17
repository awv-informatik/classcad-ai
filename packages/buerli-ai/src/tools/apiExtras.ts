// ─── Curated docs for non-v1 API methods ─────────────────────────────────────
//
// The v1 ClassCAD surface is documented in method-registry.json. The other
// callable namespaces (v0, and buerli's drawing APIs: structure/interaction/
// selection/geometry) have no registry, so list_methods reflects their method
// NAMES at runtime — but names alone make the model guess args. This map adds
// hand-written docs for the high-value methods so describe_method / call_api
// errors can show a real signature. Keep it small and accurate (only entries
// that have been verified); everything else is still discoverable by reflection.

export type ExtraEntry = {
  /** One-line description of what the method does and what it returns. */
  summary: string
  /** Positional parameters, in order. */
  params?: { name: string; text: string }[]
}

export const API_EXTRAS: Record<string, ExtraEntry> = {
  'structure.calculateProductBounds': {
    summary:
      'Axis-aligned bounding box of a product/part. Returns { center:{x,y,z}, min:{x,y,z}, max:{x,y,z}, radius }. ' +
      'radius === -1 means empty / no geometry. Compute size as max - min.',
    params: [
      { name: 'id', text: 'product/part node id (from tree/find). For the whole model/assembly pass the drawing root id.' },
    ],
  },

  // facade.* — the current drawing is auto-targeted, so DON'T pass a drawing id;
  // supply only the extra arguments listed below (often none).
  'facade.undo': { summary: 'Undo the last operation in the current drawing.' },
  'facade.redo': { summary: 'Redo the last undone operation in the current drawing.' },
  'facade.fetchTree': { summary: 'Refresh the client structure tree from the server.' },
  'facade.callMiddleware': {
    summary: 'Send a middleware command to the ClassCAD server and get its response.',
    params: [
      { name: 'middlewareCommand', text: 'the command name (string)' },
      { name: 'data', text: 'command payload (object)' },
    ],
  },
}
