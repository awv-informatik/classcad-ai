/**
 * report.mjs — Build a structured JSON report from harness run data.
 */

import { writeFileSync } from 'fs'

/**
 * Build the final report object.
 *
 * @param {object} opts
 * @param {string} opts.scriptName
 * @param {object} opts.ids         { partId, eifId, solidIds }
 * @param {object} opts.metadata    Script-provided metadata
 * @param {object} opts.extracted   Output of extractAll()
 * @param {object} opts.exports     { stl, step, ofb }
 * @param {string} opts.pngPath
 * @param {number} opts.pngWidth
 * @param {number} opts.pngHeight
 * @param {object} opts.timing      { connect, script, extract, export, render, clear, total }
 * @param {any[]}  opts.allMessages Accumulated messages from all steps
 * @returns {object}
 */
export function buildReport({
  scriptName,
  ids,
  metadata,
  extracted,
  exports: exp,
  pngPath,
  pngWidth,
  pngHeight,
  timing,
  allMessages = [],
}) {
  return {
    script: scriptName,
    timestamp: new Date().toISOString(),
    timing,
    ids,
    metadata,
    massProperties: extracted.massProperties,
    brep: extracted.brep,
    bounds: extracted.bounds,
    geometry: extracted.geometry,
    structure: extracted.structure,
    exports: {
      stl: exp.stl ? { path: exp.stl.path, bytes: exp.stl.bytes, triangles: exp.stl.triangles?.length ?? 0 } : null,
      step: exp.step ? { path: exp.step.path, bytes: exp.step.bytes } : null,
      ofb: exp.ofb ? { path: exp.ofb.path, bytes: exp.ofb.bytes } : null,
    },
    png: pngPath ? { path: pngPath, width: pngWidth, height: pngHeight } : null,
    messages: allMessages,
    errors: extracted.errors || [],
  }
}

/**
 * Save report to disk as pretty-printed JSON.
 */
export function saveReport(report, path) {
  writeFileSync(path, JSON.stringify(report, null, 2))
}
