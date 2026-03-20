/**
 * journal.mjs — Markdown journal builder for training sessions.
 *
 * This is NOT a log dump. It's a study journal — the agent's own account of
 * what it tried, what it learned, what surprised it, and what other agents
 * should know. The summary section is the most important part: it's written
 * by the agent reflecting on the session, not generated from data.
 */

import { writeFileSync } from 'fs'

/**
 * @param {object} opts
 * @param {string} opts.title          Session title
 * @param {string} opts.scriptName     Script that was executed
 * @param {string} opts.scriptSource   Raw source code of the script
 * @param {object} opts.ids            { partId, eifId, solidIds }
 * @param {object} opts.metadata       Script-provided metadata
 * @param {object} opts.extracted      Output of extractAll()
 * @param {object} opts.exports        { stl, step, ofb }
 * @param {string} opts.pngPath        Relative path to snapshot PNG
 * @param {object[]} opts.snapshots    Intermediate snapshots [{label, file, triangles, ms}]
 * @param {object} opts.timing         Timing breakdown
 * @param {object[]} opts.commandLog   Array of { api, params, result, error, ms }
 * @param {string[]} opts.warnings     Warnings encountered
 * @param {string[]} opts.errors       Errors encountered
 * @param {string}   opts.summary      Agent-written summary — the heart of the journal.
 *                                     What was the goal? What happened? What was learned?
 *                                     What was surprising? What should other agents know?
 * @param {string[]} opts.findings     Key takeaways — concise bullets for skill annotation
 * @param {string[]} opts.troubles     Problems hit and how they were resolved
 */
export function buildJournal({
  title,
  scriptName,
  scriptSource,
  ids,
  metadata,
  extracted,
  exports: exp,
  pngPath,
  directRenders = [],
  snapshots = [],
  timing,
  commandLog = [],
  warnings = [],
  errors = [],
  summary = '',
  findings = [],
  troubles = [],
}) {
  const lines = []
  const ln = (...args) => lines.push(args.join(''))

  ln('# ', title)
  ln()
  ln('**Date:** ', new Date().toISOString())
  ln('**Script:** `', scriptName, '`')
  if (metadata && Object.keys(metadata).length) {
    ln('**Metadata:** ', JSON.stringify(metadata))
  }
  ln()

  // ── Summary (the most important section) ─────────────────────────────
  if (summary) {
    ln('## Summary')
    ln()
    // Truncate lines that look like raw JSON dumps (>500 chars)
    const cleanSummary = summary.split('\n').map(line => {
      if (line.length > 500) return line.slice(0, 200) + '… (truncated)'
      return line
    }).join('\n')
    ln(cleanSummary)
    ln()
  }

  // Snapshot
  if (pngPath || (directRenders && directRenders.length)) {
    ln('## Final Snapshot')
    ln()
    if (directRenders && directRenders.length) {
      for (const f of directRenders) ln('![snapshot](', f, ')')
    } else if (pngPath) {
      ln('![snapshot](', pngPath, ')')
    }
    ln()
  }

  // Intermediate snapshots
  if (snapshots.length) {
    ln('## Intermediate Snapshots')
    ln()
    for (const snap of snapshots) {
      ln('### ', snap.label)
      ln()
      // Show all PNG images (direct renders + legacy)
      const pngEntries = Object.entries(snap.files || {}).filter(([k]) => k.startsWith('png'))
      for (const [, entry] of pngEntries) {
        if (entry.file) {
          ln('![', snap.label, '](', entry.file, ')')
          ln()
        }
      }
      const parts = []
      if (snap.files?.stl) parts.push(`STL: ${snap.files.stl.triangles} triangles, ${snap.files.stl.bytes} bytes`)
      if (snap.files?.step) parts.push(`STEP: ${snap.files.step.bytes} bytes`)
      if (snap.files?.ofb) parts.push(`OFB: ${snap.files.ofb.bytes} bytes`)
      if (parts.length) ln('_', parts.join(' · '), ' · ', snap.ms, 'ms_')
      ln()
    }
  }

  // ── Key Findings ─────────────────────────────────────────────────────
  if (findings.length) {
    ln('## Key Findings')
    ln()
    for (const f of findings) ln('- ', f)
    ln()
  }

  // ── Troubles & Resolutions ───────────────────────────────────────────
  if (troubles.length) {
    ln('## Troubles & Resolutions')
    ln()
    for (const t of troubles) ln('- ', t)
    ln()
  }

  // ── Warnings ─────────────────────────────────────────────────────────
  if (warnings.length) {
    ln('## ⚠️ Warnings')
    ln()
    for (const w of warnings) ln('- ⚠️ ', w)
    ln()
  }

  // ── Errors ───────────────────────────────────────────────────────────
  if (errors.length || extracted?.errors?.length) {
    ln('## ❌ Errors')
    ln()
    for (const e of errors) ln('- ❌ ', e)
    for (const e of (extracted?.errors || [])) ln('- ❌ [', e.step, '] ', e.error)
    ln()
  }

  // ── Results ──────────────────────────────────────────────────────────
  ln('## Results')
  ln()
  ln('### IDs')
  ln()
  ln('| Key | Value |')
  ln('|-----|-------|')
  ln('| partId | ', ids?.partId, ' |')
  ln('| eifId | ', ids?.eifId, ' |')
  ln('| solidIds | ', JSON.stringify(ids?.solidIds), ' |')
  ln()

  if (extracted?.massProperties) {
    ln('### Mass Properties')
    ln()
    const mp = extracted.massProperties
    ln('- **Volume:** ', mp.volume)
    if (mp.cog) ln('- **Center of Gravity:** [', mp.cog.x, ', ', mp.cog.y, ', ', mp.cog.z, ']')
    ln()
  }

  if (extracted?.brep) {
    ln('### BRep Topology')
    ln()
    ln('| Element | Count | IDs |')
    ln('|---------|-------|-----|')
    ln('| Faces | ', extracted.brep.faces.count, ' | ', JSON.stringify(extracted.brep.faces.ids), ' |')
    ln('| Edges | ', extracted.brep.edges.count, ' | ', JSON.stringify(extracted.brep.edges.ids), ' |')
    ln('| Vertices | ', extracted.brep.vertices.count, ' | ', JSON.stringify(extracted.brep.vertices.ids), ' |')
    const V = extracted.brep.vertices.count
    const E = extracted.brep.edges.count
    const F = extracted.brep.faces.count
    ln()
    ln('**Euler characteristic:** V-E+F = ', V, '-', E, '+', F, ' = ', V - E + F)
    ln()
  }

  if (extracted?.bounds) {
    ln('### Bounding Box')
    ln()
    ln('- **Min:** ', JSON.stringify(extracted.bounds.min))
    ln('- **Max:** ', JSON.stringify(extracted.bounds.max))
    const b = extracted.bounds
    ln('- **Size:** [', b.max[0] - b.min[0], ', ', b.max[1] - b.min[1], ', ', b.max[2] - b.min[2], ']')
    ln()
  }

  // Exports
  if (exp) {
    ln('### Exports')
    ln()
    ln('| Format | File | Size |')
    ln('|--------|------|------|')
    if (exp.stl) ln('| STL | `', exp.stl.path, '` | ', exp.stl.bytes, ' bytes (', exp.stl.triangles?.length ?? 0, ' triangles) |')
    if (exp.step) ln('| STEP | `', exp.step.path, '` | ', exp.step.bytes, ' bytes |')
    if (exp.ofb) ln('| OFB | `', exp.ofb.path, '` | ', exp.ofb.bytes, ' bytes |')
    ln()
  }

  // Timing
  if (timing) {
    ln('## Timing')
    ln()
    ln('| Phase | ms |')
    ln('|-------|----|')
    for (const [k, v] of Object.entries(timing)) {
      ln('| ', k, ' | ', v, ' |')
    }
    ln()
  }

  // ── Script Source ────────────────────────────────────────────────────
  ln('## Script')
  ln()
  ln('```js')
  ln(scriptSource)
  ln('```')
  ln()

  // ── Command Log (collapsed — detail, not the headline) ──────────────
  if (commandLog.length) {
    const errCount = commandLog.filter(e => e.error).length
    const warnCount = commandLog.filter(e => e.messages?.some(m => m.level >= 41)).length
    const logSummary = [
      `${commandLog.length} commands`,
      errCount ? `❌ ${errCount} errors` : null,
      warnCount ? `⚠️ ${warnCount} with warnings` : null,
    ].filter(Boolean).join(', ')

    ln('## Command Log')
    ln()
    ln('<details>')
    ln('<summary>', logSummary, ' (click to expand)</summary>')
    ln()
    for (const entry of commandLog) {
      const status = entry.error ? '❌ ERROR' : 'OK'
      ln('### `', entry.api, '` — ', status, ' (', entry.ms, 'ms)')
      ln()
      if (entry.params !== undefined) {
        ln('**Params:**')
        ln('```json')
        ln(JSON.stringify(entry.params, null, 2))
        ln('```')
        ln()
      }
      if (entry.error) {
        ln('❌ **Error:** ', entry.error)
        ln()
      } else if (entry.result !== undefined) {
        const resultStr = JSON.stringify(entry.result, null, 2)
        ln('**Result:**')
        if (resultStr.length > 500) {
          // Truncate large results — full data is in report.json
          const preview = JSON.stringify(entry.result)
          ln('```')
          ln(preview.length > 200 ? preview.slice(0, 200) + '… (truncated, see report.json)' : preview)
          ln('```')
        } else {
          ln('```json')
          ln(resultStr)
          ln('```')
        }
        ln()
      }
      if (entry.messages?.length) {
        ln('**Messages:**')
        for (const m of entry.messages) {
          const icon = m.level >= 51 ? '❌' : m.level >= 41 ? '⚠️' : 'ℹ️'
          ln('- ', icon, ' [level ', m.level, '] ', m.message.trim())
        }
        ln()
      }
    }
    ln('</details>')
    ln()
  }

  // Structure tree omitted — available in report.json

  return lines.join('\n')
}

/**
 * Save journal markdown to disk.
 */
export function saveJournal(content, path) {
  writeFileSync(path, content)
}
