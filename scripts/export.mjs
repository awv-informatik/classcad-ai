/**
 * export.mjs — Export helpers for STL, STEP, and OFB formats.
 * Also includes a binary STL parser.
 */

import { writeFileSync } from 'fs'

/**
 * Export the current drawing as binary STL.
 * @returns {{ buffer: Buffer, triangles: Triangle[], path?: string }}
 */
export async function exportSTL(client, { outPath, facetingTol = 0.1, angleTol = 6 } = {}) {
  const r = await client.execute({
    'v1.common.save': [{
      format: 'STL',
      encoding: 'base64',
      stl: { binary: true, facetingTol, angleTol },
    }],
  })
  if (!r.result?.success || !r.result?.content) {
    throw new Error('STL export failed: ' + JSON.stringify(r.messages))
  }
  const buffer = Buffer.from(r.result.content, 'base64')
  const triangles = parseSTL(buffer)
  if (outPath) writeFileSync(outPath, buffer)
  return { buffer, triangles, path: outPath, bytes: buffer.length }
}

/**
 * Export the current drawing as STEP.
 * @returns {{ buffer: Buffer, path?: string }}
 */
export async function exportSTEP(client, { outPath, version = 2 } = {}) {
  const r = await client.execute({
    'v1.common.save': [{
      format: 'STP',
      encoding: 'base64',
      stp: { version },
    }],
  })
  if (!r.result?.success || !r.result?.content) {
    throw new Error('STEP export failed: ' + JSON.stringify(r.messages))
  }
  const buffer = Buffer.from(r.result.content, 'base64')
  if (outPath) writeFileSync(outPath, buffer)
  return { buffer, path: outPath, bytes: buffer.length }
}

/**
 * Export the current drawing as OFB (native ClassCAD format).
 * @returns {{ buffer: Buffer, path?: string }}
 */
export async function exportOFB(client, { outPath } = {}) {
  const r = await client.execute({
    'v1.common.save': [{
      format: 'OFB',
      encoding: 'base64',
    }],
  })
  if (!r.result?.success || !r.result?.content) {
    throw new Error('OFB export failed: ' + JSON.stringify(r.messages))
  }
  const buffer = Buffer.from(r.result.content, 'base64')
  if (outPath) writeFileSync(outPath, buffer)
  return { buffer, path: outPath, bytes: buffer.length }
}

/**
 * Parse a binary STL buffer into an array of triangles.
 * Binary STL: 80-byte header, 4-byte uint32 tri count, 50 bytes per triangle.
 *
 * @param {Buffer} buf
 * @returns {{ normal: number[], vertices: number[][] }[]}
 */
export function parseSTL(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const triCount = dv.getUint32(80, true)
  const triangles = []
  let offset = 84
  for (let i = 0; i < triCount; i++) {
    const nx = dv.getFloat32(offset, true); offset += 4
    const ny = dv.getFloat32(offset, true); offset += 4
    const nz = dv.getFloat32(offset, true); offset += 4
    const v = []
    for (let j = 0; j < 3; j++) {
      const x = dv.getFloat32(offset, true); offset += 4
      const y = dv.getFloat32(offset, true); offset += 4
      const z = dv.getFloat32(offset, true); offset += 4
      v.push([x, y, z])
    }
    offset += 2 // attribute byte count
    triangles.push({ normal: [nx, ny, nz], vertices: v })
  }
  return triangles
}
