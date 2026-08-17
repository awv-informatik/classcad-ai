# Training: sketch.loadFrom

**Date:** 2026-04-13

## Goal

Testing `v1.sketch.loadFrom` — loads sketch geometry from an OFB file (by data, URL, or file path) into an existing sketch.

**Methods to cover:**

- `loadFrom` via `data` param (base64-encoded OFB)
- `loadFrom` with `name` param (select specific sketch from OFB)
- `loadFrom` into a sketch that already has geometry (merge behavior)
- `loadFrom` with empty source sketch in the OFB
- `loadFrom` with invalid/missing params (error cases)
- `loadFrom` with `encoding` and `compression` params

**Questions:**

- Does loadFrom merge geometry like copyFrom, or replace?
- Does loadFrom copy constraints from the source sketch?
- What happens when the OFB contains multiple sketches and no `name` is given?
- What happens with invalid/corrupted data?
- Does the `format` param matter (it defaults to OFB)?

---

## Server Status

**ClassCAD server is unreachable** (ECONNREFUSED on ws://0.0.0.0:9094/). Docker daemon is not running. No ClassCAD process found.

Per HOW-TO-TRAIN.md: writing LLM doc from source docs + patterns learned from related `sketch.copyFrom` training. All sections marked as UNVERIFIED.

## 01 — basic loadFrom via data (NOT RUN)

Script: `scripts/01-basic-data.mjs` — **NOT RUN** (server unreachable).

Strategy: save part+sketch as OFB base64 → create new part+sketch → loadFrom with data param. Would test basic data-loading path.

**📌 LLM doc:** Write to `references/sketch/loadFrom.md` — document all params, behavior inferred from docs + copyFrom patterns. Mark as UNVERIFIED.
