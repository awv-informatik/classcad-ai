# Sketch Curve Splitting & Trimming — Usage Guide

## Overview

The ClassCAD Sketch API provides two distinct workflows for splitting curves. Understanding when to use which is essential.

| API | Purpose | Reversible? | Use case |
|-----|---------|-------------|----------|
| `splitCurve` | Split a curve at explicit parameter positions | Yes (permanent new curves) | You know *exactly where* to cut |
| `preTrim` | Find all intersections and split curves at those points | Yes (via `postTrim`) | You want to *trim away segments* |
| `trim` | Remove unwanted curve segments | Only before `postTrim` | Select which parts to discard |
| `postTrim` | Reassemble remaining parts, finalize | — | Complete the trim operation |

### Deprecated APIs (kept for backward compatibility)

| Deprecated API | Replacement |
|----------------|-------------|
| `splitCurves` | `splitCurve` |
| `splitAllCurves` | `preTrim` |
| `trimCurves` | `trim` |
| `splitCurvesMergeBack` | `postTrim` |

---

## Workflow 1: Direct Split (`splitCurve`)

**Use when:** You want to permanently divide a curve at known parameter values.

```javascript
// Split a line at 25% and 75% of its length
result = api.v1.sketch.splitCurve({
  id: sketch,
  splits: [
    { geomId: line1, values: [0.25, 0.75] }
  ]
});
// result.result → [{ sourceId: line1, splittedCurves: [{ id: seg1, interval: [0, 0.25] }, { id: seg2, interval: [0.25, 0.75] }, { id: seg3, interval: [0.75, 1] }] }]
// N split values produce N+1 segments per curve
```

**Key facts:**
- Parameter values are in range `[0, 1]` (normalized curve domain)
- The original curve is replaced by the new segments
- Returns structured result: `Array<{ sourceId, splittedCurves: Array<{ id, interval }> }>` (same format as `preTrim`)
- This is a **standalone operation** — no merge-back needed
- Undoable via the standard undo mechanism

> **Note:** `splitCurve` requires you to supply exact normalized parameter values (`[0, 1]`) for where to cut. These values are difficult to determine from the outside — they correspond to the internal curve parameterization and are typically only known by the sketcher plugin (e.g., computed from intersection calculations or user click positions projected onto the curve). For most use cases where you want to split at intersections, prefer the `preTrim`/`trim`/`postTrim` workflow which computes the split positions automatically.

---

## Workflow 2: preTrim → trim → postTrim

**Use when:** You want to cut away parts of curves at their intersections, similar to a "trim" in CAD.

This is a **three-step workflow** that must be executed in order:

### Step 1: preTrim (split at intersections)

```javascript
// Split ALL curves in the sketch
result = api.v1.sketch.preTrim({ id: sketch });

// Or split only specific curves against each other
result = api.v1.sketch.preTrim({
  id: sketch,
  curveIds: [line1, line2, arc1]
});
```

**What happens internally:**
- Curves are split at every mutual intersection point
- Original curves are moved into internal containers (`SplittedCurves`, `NoneSplitted`)
- The sketch now contains only the split parts

**Return value (structured per input curve):**
```javascript
result.result = [
  {
    sourceId: line1,  // original curve
    splittedCurves: [
      { id: part_0, interval: [0, 0.4] },
      { id: part_1, interval: [0.4, 1.0] }
    ]
  },
  {
    sourceId: line2,
    splittedCurves: [
      { id: part_2, interval: [0, 0.6] },
      { id: part_3, interval: [0.6, 1.0] }
    ]
  }
]
```

- One entry per input curve, in the same order
- `interval` shows which portion of the original curve the part covers (`[0,1]` domain)
- Unsplit curves (no intersections) get a single part with `interval: [0, 1]`

### Step 2: trim (remove unwanted segments)

```javascript
// Remove the parts you don't want
api.v1.sketch.trim({
  id: sketch,
  curveIds: [part_1, part_2]  // IDs from preTrim result
});
```

**Key facts:**
- Pass the `id` values from the `splittedCurves` array of `preTrim` result
- Trimmed curves are deleted — only the remaining segments survive
- You can call `trim` multiple times before `postTrim`

### Step 3: postTrim (merge back)

```javascript
api.v1.sketch.postTrim({ id: sketch });
```

**What happens:**
- Remaining parts are merged back into proper sketch curves
- Constraints are recreated for the surviving geometry
- Internal containers (`SplittedCurves`, `NoneSplitted`) are cleaned up
- The sketch returns to a normal editable state

---

## When to use `curveIds` parameter

By default, `preTrim` processes ALL curves in the sketch. Use `curveIds` to restrict the operation:

```javascript
// Only split line1 and arc1 against each other
// Other curves in the sketch remain untouched
api.v1.sketch.preTrim({
  id: sketch,
  curveIds: [line1, arc1]
});
```

**Important:** Curves not in `curveIds` are preserved in the `NoneSplitted` container and restored during `postTrim`. They do not participate in the intersection computation.

---

## Decision Flowchart

```
Do you know the exact parameter positions where to split?
├── YES → use splitCurve (one-step, permanent)
└── NO, I want to split at intersections and remove parts
    └── use the three-step workflow:
        1. preTrim (find intersections, produce parts)
        2. trim (remove unwanted parts)
        3. postTrim (finalize)
```

---

## Constraints and special cases

- **Construction lines** (`isConstruction: true`) are not trimmable — they appear in the result with `interval: [0, 1]` but cannot be trimmed
- **RigidSet members** are not trimmable — same behavior as construction lines
- **Curves without intersections** are not split — they get a single part in the result
- **postTrim** is also called automatically when `StopEditing` is called on a sketch
- Calling `preTrim` a second time without `postTrim` first will overwrite the previous split state

---

## Hint for AI / automated usage

When working with many curves that need to be intersected and trimmed, **prefer multiple small preTrim-trim-postTrim cycles over one large operation**. For example, instead of splitting 20 curves at once and trying to identify all parts to trim in one go:

1. Pick a small subset of curves (e.g., 2–4 that you know intersect)
2. Call `preTrim` with those `curveIds`
3. Inspect the result — verify the parts and intervals are as expected
4. Call `trim` to remove the unwanted parts
5. Call `postTrim` to finalize
6. Repeat with the next subset

**Why this is better:**
- Each step can be verified before proceeding — if the result looks wrong, you can call `postTrim` without trimming and try differently
- Smaller subsets produce fewer parts, making it easier to identify which part to trim
- Errors are localized — you know exactly which curve pair caused an unexpected result
- The sketch is in a clean state between cycles, so you can query geometry positions, run constraint solving, etc.

---

## Complete Example: Trim a rectangle with a diagonal line

```javascript
// Create geometry
const rect = api.v1.sketch.rectangle({ id: sketch, startPos: [0,0,0], endPos: [100,50,0] });
const diag = api.v1.sketch.line({ id: sketch, startPos: [0,0,0], endPos: [100,50,0] });

// Step 1: Split all curves at their intersections
const splitResult = api.v1.sketch.preTrim({ id: sketch });

// Step 2: Identify which parts to remove (e.g., the diagonal extends beyond the rectangle)
// Use the interval information to find the right segments
const diagEntry = splitResult.result.find(e => e.sourceId === diag.result);
const partsToRemove = diagEntry.splittedCurves.filter(p => /* your selection logic */);

// Step 3: Trim the unwanted parts
api.v1.sketch.trim({
  id: sketch,
  curveIds: partsToRemove.map(p => p.id)
});

// Step 4: Merge back
api.v1.sketch.postTrim({ id: sketch });
```
