/**
 * @classcad/renderer — deterministic renderer for ClassCAD session data.
 *
 * The root export is the PORTABLE core (pure data → pixels/SVG, no
 * dependencies). For PNG encoding / files pick an adapter:
 *   import { renderSession } from '@classcad/renderer/node'      (sharp)
 *   import { entryToPngBase64 } from '@classcad/renderer/browser' (canvas)
 */
export * from './core.mjs'
export * from './stl.mjs'
