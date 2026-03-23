<a name="arcBy3Points"></a>

## arcBy3Points(param)

Creates one or multiple arcs defined by start-, end- and mid point.

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param          | Type                                                        | Description                                                |
| -------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| param          | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing all the parameters            |
| param.id       | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the shape, which is the container of the created arc |
| param.startPos | <code>point</code>                                          | start position of the arc                                  |
| param.endPos   | <code>point</code>                                          | end position of the arc                                    |
| param.midPos   | <code>point</code>                                          | middle position on the arc                                 |

**Example**

```js
api.v1.curve.arcBy3Points({ id: shape, midPos: [0, 0, 0], startPos: [10, 0, 0], endPos: [0, 10, 0] })
```

<a name="arcByCenterRadAngle"></a>

## arcByCenterRadAngle(param)

Creates one or multiple arcs defined by center, radius and angle

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param            | Type                                                        | Default              | Description                                                |
| ---------------- | ----------------------------------------------------------- | -------------------- | ---------------------------------------------------------- |
| param            | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                      | object or objects containing all the parameters            |
| param.id         | <code>string</code> \| <code>real</code> \| <code>id</code> |                      | id of the shape, which is the container of the created arc |
| param.centerPos  | <code>point</code>                                          |                      | center of arc                                              |
| [param.xAxis]    | <code>point</code>                                          | <code>[1,0,0]</code> | where the arc starts (default=[1,0,0])                     |
| [param.normal]   | <code>point</code>                                          | <code>[0,0,1]</code> | should be different to xAxis (default=[0,0,1])             |
| param.startAngle | <code>real</code>                                           |                      | startAngle in radian                                       |
| param.endAngle   | <code>real</code>                                           |                      | endAngle in radian                                         |
| param.radius     | <code>real</code>                                           |                      | radius                                                     |

**Example**

```js
api.v1.curve.arcByCenterRadAngle({ id: shape, centerPos: [0, 0, 0], startAngle: 0, endAngle: 1.57, radius: 5 })
```

<a name="arcByCenter"></a>

## arcByCenter(param)

Creates one or multiple arcs defined by start-, end- and center point.

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                        | Default           | Description                                                                                                    |
| ------------------- | ----------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| param               | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                   | object or objects containing all the parameters                                                                |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the shape, which is the container of the created arc                                                     |
| param.startPos      | <code>point</code>                                          |                   | start position of the arc                                                                                      |
| param.endPos        | <code>point</code>                                          |                   | end position of the arc                                                                                        |
| param.centerPos     | <code>point</code>                                          |                   | center position of the arc                                                                                     |
| [param.isClockwise] | <code>boolean</code>                                        | <code>TRUE</code> | flag to define whether the arc is clockwise from start- to end-point around center-point or not (default=TRUE) |

**Example**

```js
api.v1.curve.arcByCenter({ id: shape, centerPos: [0, 0, 0], startPos: [10, 0, 0], endPos: [0, 10, 0] })
```

<a name="bezierCurve"></a>

## bezierCurve(param)

Creates one or multiple BezierCurves of degree n (number of points -1)

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                                                        | Description                                                                            |
| ------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| param        | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing all the parameters                                        |
| param.id     | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the shape, which is the container of the created bezier curve                    |
| param.points | <code>Array&lt;point&gt;</code>                             | The control points of the curve, n + 1 points are needed to create a curve of degree n |

**Example**

```js
api.v1.curve.bezierCurve({
  id: shape,
  points: [
    [0, 0, 0],
    [0, 10, 0],
    [10, 10, 0],
    [10, 0, 0],
  ],
})
```

<a name="ellipticArc"></a>

## ellipticArc(param)

Creates one or multiple elliptic arc curves

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param            | Type                                                        | Default              | Description                                                         |
| ---------------- | ----------------------------------------------------------- | -------------------- | ------------------------------------------------------------------- |
| param            | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                      | object or objects containing all the parameters                     |
| param.id         | <code>string</code> \| <code>real</code> \| <code>id</code> |                      | id of the shape, which is the container of the created elliptic arc |
| param.centerPos  | <code>point</code>                                          |                      | center position of elliptic arc                                     |
| [param.xAxis]    | <code>point</code>                                          | <code>[1,0,0]</code> | where the arc starts (default=[1,0,0])                              |
| [param.normal]   | <code>point</code>                                          | <code>[0,0,1]</code> | should be different to xAxis (default=[0,0,1])                      |
| param.startAngle | <code>real</code>                                           |                      | startAngle in radian                                                |
| param.endAngle   | <code>real</code>                                           |                      | endAngle in radian                                                  |
| param.radius1    | <code>real</code>                                           |                      | major radius                                                        |
| param.radius2    | <code>real</code>                                           |                      | minor radius                                                        |

**Example**

```js
api.v1.curve.ellipticArc({ id: shape, centerPos: [0, 0, 0], startAngle: 0, endAngle: 1.57, radius1: 5, radius2: 10 })
```

<a name="ellipse"></a>

## ellipse(param)

Creates one or multiple ellipse curves

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param           | Type                                                        | Default              | Description                                                    |
| --------------- | ----------------------------------------------------------- | -------------------- | -------------------------------------------------------------- |
| param           | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                      | object or objects containing all the parameters                |
| param.id        | <code>string</code> \| <code>real</code> \| <code>id</code> |                      | id of the shape, which is the container of the created ellipse |
| param.centerPos | <code>point</code>                                          |                      | Center of ellipse                                              |
| [param.xAxis]   | <code>point</code>                                          | <code>[1,0,0]</code> | where the arc starts (default=[1,0,0])                         |
| [param.normal]  | <code>point</code>                                          | <code>[0,0,1]</code> | should be different to xAxis (default=[0,0,1])                 |
| param.radius1   | <code>real</code>                                           |                      | major radius                                                   |
| param.radius2   | <code>real</code>                                           |                      | minor radius                                                   |

**Example**

```js
api.v1.curve.ellipse({ id: shape, centerPos: [0, 0, 0], radius1: 5, radius2: 10 })
```

<a name="interpolationCurve"></a>

## interpolationCurve(param)

Creates an interpolation curve through given array of points

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                                                        | Description                                                                |
| ------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| param        | <code>object</code>                                         | object containing all the parameters                                       |
| param.id     | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the shape, which is the container of the created interpolation curve |
| param.points | <code>Array&lt;point&gt;</code>                             | needs always degree + 1 points                                             |

**Example**

```js
api.v1.curve.interpolationCurve({
  id: shape,
  points: [
    [0, 0, 0],
    [5, 15, 0],
    [10, 0, 0],
  ],
})
```

<a name="line"></a>

## line(param)

Creates one or multiple lines in a shape container

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param          | Type                                                        | Description                                                 |
| -------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| param          | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing all the parameters             |
| param.id       | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the shape, which is the container of the created line |
| param.startPos | <code>point</code>                                          | start position of the line                                  |
| param.endPos   | <code>point</code>                                          | end position of the line                                    |

**Example**

```js
api.v1.curve.line({ id: shape, startPos: [0, 0, 0], endPos: [10, 10, 0] })
```

<a name="polyline2d"></a>

## polyline2d(param)

Creates a single or multiple entity array of lines and arcs, given a polyline definition with array of points and bulges
The points of the poyline must lying in the same plane.
The bulge is tan(a/4), a is the included angle for the arc between the two points.
A bulge is positive for arcs directed counterclockwise when looking in opposite direction of the normal.
A semicircle has the bulge 1, a straight line the bulge 0.

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param          | Type                                                        | Default            | Description                                                                       |
| -------------- | ----------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------- |
| param          | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                    | object or objects containing all the parameters                                   |
| param.id       | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the shape, which is the container of the created polyline2d                 |
| param.points   | <code>Array&lt;point&gt;</code>                             |                    | positions of the polyline defining the segments                                   |
| [param.bulges] | <code>Array&lt;real&gt;</code>                              |                    | bulge for each segment between two points, there must be as many bulges as points |
| [param.close]  | <code>boolean</code>                                        | <code>FALSE</code> | closes the polyline by connecting the start- and endpoint (default=FALSE)         |

**Example**

```js
api.v1.curve.polyline2d({
  id: shape,
  points: [
    [0, 0, 0],
    [10, 0, 0],
    [10, 10, 0],
    [0, 10, 0],
    [0, 0, 0],
  ],
  bulges: [0.3, -0.3, 0.3, -0.3, 0],
})
```

<a name="deleteShape"></a>

## deleteShape(param)

Deletes shapes

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param     | Type                                         | Description                          |
| --------- | -------------------------------------------- | ------------------------------------ |
| param     | <code>object</code>                          | object containing all the parameters |
| param.ids | <code>Array&lt;(string\|real\|id)&gt;</code> | ids of the shapes to delete          |

**Example**

```js
api.v1.curve.deleteShape({ ids: [52, 25, 68] })
```

<a name="shape"></a>

## shape(param)

Creates a shape in a container

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the created shape to use as container for curves
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                                                        | Default                        | Description                                                                                                                                                 |
| ------------ | ----------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param        | <code>object</code>                                         |                                | object containing all the parameters                                                                                                                        |
| param.id     | <code>string</code> \| <code>real</code> \| <code>id</code> |                                | id of the entity injection feature to create the shape in                                                                                                   |
| [param.name] | <code>string</code>                                         | <code>&quot;Shape&quot;</code> | name for the shape, if not set, the shape will get the default name "Shape" or if that already exists, an additional unique number, e.g. "Shape0", "Shape1" |

**Example**

```js
api.v1.curve.shape({ id: entityInjectionFeature })
api.v1.curve.shape({ id: entityInjectionFeature, name: 'SpecialShape' })
```

<a name="circle"></a>

## circle(param)

Creates one or multiple circles in a shape container

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param           | Type                                                        | Default              | Description                                                   |
| --------------- | ----------------------------------------------------------- | -------------------- | ------------------------------------------------------------- |
| param           | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                      | object or objects containing all the parameters               |
| param.id        | <code>string</code> \| <code>real</code> \| <code>id</code> |                      | id of the shape, which is the container of the created circle |
| param.centerPos | <code>point</code>                                          |                      | center of arc                                                 |
| [param.normal]  | <code>point</code>                                          | <code>[0,0,1]</code> | defines orientation in 3d space (default=[0,0,1])             |
| param.radius    | <code>real</code>                                           |                      | radius                                                        |

**Example**

```js
api.v1.curve.circle({ id: shape, centerPos: [0, 0, 0], radius: 5 })
```

<a name="translateShape"></a>

## translateShape(param)

Translates the given shape by the given vector. The vector is in coordinates of the part
where the provided shape belongs to.

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                        | Description                              |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------- |
| param             | <code>object</code>                                         | object containing all the parameters     |
| param.id          | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the shape to translate             |
| param.translation | <code>point</code>                                          | translation vector along x, y and z-axis |

**Example**

```js
api.v1.curve.translateShape({ id: shape, translation: [25, 0, 0] })
```

<a name="rotateShape"></a>

## rotateShape(param)

Rotates the given shape by the given rotation vector. The vector is in coordinates of the part
where the provided shape belongs to.

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param          | Type                                                        | Description                                                  |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| param          | <code>object</code>                                         | object containing all the parameters                         |
| param.id       | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the shape to rotate                                    |
| param.rotation | <code>point</code>                                          | rotation vector containing rotations around x, y, and z-axis |

**Example**

```js
api.v1.curve.rotateShape({ id: shape, rotation: [3.14, 0, 0] })
```

<a name="union2d"></a>

## union2d(param)

Creates an union between two shapes

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                        | Default            | Description                                                                  |
| ----------------- | ----------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| param             | <code>object</code>                                         |                    | object containing all the parameters                                         |
| param.target      | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the shape to use as base                                               |
| param.tool        | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the shape to use as tool                                               |
| [param.keepShape] | <code>boolean</code>                                        | <code>FALSE</code> | flag to define whether the tool curves should be kept or not (default=FALSE) |

**Example**

```js
api.v1.curve.union2d({ target: shape1, tool: shape2 })
```

<a name="subtraction2d"></a>

## subtraction2d(param)

Creates an subtraction between two shapes

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                        | Default            | Description                                                                  |
| ----------------- | ----------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| param             | <code>object</code>                                         |                    | object containing all the parameters                                         |
| param.target      | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the shape to use as base                                               |
| param.tool        | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the shape to use as tool to subtract                                   |
| [param.keepShape] | <code>boolean</code>                                        | <code>FALSE</code> | flag to define whether the tool curves should be kept or not (default=FALSE) |

**Example**

```js
api.v1.curve.subtraction2d({ target: shape1, tool: shape2, keepShape: TRUE })
```

<a name="intersection2d"></a>

## intersection2d(param)

Creates an intersection between two shapes

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                        | Default            | Description                                                                 |
| ----------------- | ----------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------- |
| param             | <code>object</code>                                         |                    | object containing all the parameters                                        |
| param.target      | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the shape to use as base                                              |
| param.tool        | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the shape to use as tool for intersection                             |
| [param.keepShape] | <code>boolean</code>                                        | <code>FALSE</code> | flag to define whether the tool curves should be kept or not(default=FALSE) |

**Example**

```js
api.v1.curve.intersection2d({ target: shape1, tool: shape2, keepShape: TRUE })
```

<a name="advancedPolyline"></a>

## advancedPolyline(param)

Creates an advanced polyline definition using an array of point-line definitions.

A polyline must start with an initial point-line definition (pld) using absolute coordinates:
`{ xa: value, ya: value }`

Subsequent points can be defined in multiple ways:

- **Absolute coordinates**: `{ xa: value, ya: value }`
- **Relative coordinates**: `{ xr: value, yr: value }`
- **Mixed mode**: `{ xa: value, yr: value }` or `{ xr: value, ya: value }`

A segment can also be defined using angle and length:

- **Absolute angle and length**: `{ l: value, a: angle }`
  - The angle is measured counterclockwise (CCW) from the x-axis.
- **Relative angle and length**: `{ l: value, ar: angle }`
  - The angle is measured CCW from the previous segments direction.
    A segment can also be defined using angle and an absolute or relative coordinates. Angle is defined as above and length is calculated internally:
- Examples of this: `{ xa: value, a: value }`, `{ xr: value, a: value }`, `{ yr: value, a: value }`, `{ ya: value, ar: value }`

Each point-line definition can optionally have a radius `{ r: value }`, which creates an arc that is tangent to both the previous and next segments. When a radius is specified:

- The defined point remains collinear with both adjacent segments but does not belong to the actual polyline.
- Cannot be applied with chamfer on the same point.

Each point-line definition can optionally have a chamfer `{ c: value }`, which creates a symmetric Chamfer of length `{ c: value }` also called edge distance, measured along the edge of the original part before the chamfer was applied.

- Cannot be applied with fillet on the same point.

The polyline can be closed (`close: true`), which connects the last point back to the first point.

- If closed, the first point can also have a radius, forming a smooth transition.

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, state: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param          | Type                                                        | Default            | Description                                                              |
| -------------- | ----------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------ |
| param          | <code>object</code>                                         |                    | object containing all the parameters                                     |
| param.id       | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the shape, which is the container of the created advanced polyline |
| param.pld      | <code>Array&lt;object&gt;</code>                            |                    | array of PointLineDefinitions (PLDs) defining the polyline               |
| [param.pld.xa] | <code>real</code>                                           |                    | absolute x-coordinate                                                    |
| [param.pld.xr] | <code>real</code>                                           |                    | relative x movement from the last point                                  |
| [param.pld.ya] | <code>real</code>                                           |                    | absolute y-coordinate                                                    |
| [param.pld.yr] | <code>real</code>                                           |                    | relative y movement from the last point                                  |
| [param.pld.a]  | <code>real</code>                                           |                    | absolute angle (radians, CCW from x-axis)                                |
| [param.pld.ar] | <code>real</code>                                           |                    | relative angle (radians, CCW from the last segment's direction)          |
| [param.pld.l]  | <code>real</code>                                           |                    | length of the segment                                                    |
| [param.pld.r]  | <code>real</code>                                           |                    | radius of a connecting arc.                                              |
| [param.pld.c]  | <code>real</code>                                           |                    | chamfer offset of a connecting line segment                              |
| [param.close]  | <code>boolean</code>                                        | <code>false</code> | whether to close the polyline by connecting the last point to the first  |

**Example**

```js
// Example 1: Simple rectangle, closed
api.v1.curve.advancedPolyline({
  id: shape1,
  pld: [
    { xa: 0, ya: 0 },
    { xa: 10, ya: 0 },
    { xa: 10, ya: 10 },
    { xa: 0, ya: 10 },
  ],
  close: true,
})
```

**Example**

```js
// Example 2: Polyline using relative movements
api.v1.curve.advancedPolyline({
  id: shape2,
  pld: [
    { xa: 0, ya: 0 },
    { xr: 10, yr: 0 },
    { xr: 0, yr: 10 },
    { xr: -10, yr: 0 },
  ],
  close: true,
})
```

**Example**

```js
// Example 3: Using angle and length definitions
api.v1.curve.advancedPolyline({
  id: shape3,
  pld: [
    { xa: 0, ya: 0 },
    { l: 10, a: 0 }, // Move 10 units at 0 degrees
    { l: 10, a: 1.57 }, // Move 10 units at 90 degrees
    { l: 10, ar: 1.57 }, // Move 10 units, turning 90 degrees CCW from last segment
  ],
  close: true,
})
```

**Example**

```js
// Example 4: Using movement and angle definitions
api.v1.curve.advancedPolyline({
  id: shape4,
  pld: [
    { xa: 0, ya: 0 },
    { ya: 10, a: 0.785 }, // Move at 45 degrees, reaching y=10
    { xr: 10, a: 0 }, // Move at 0 degrees, passing 10 units along x-axis
    { yr: -10, ar: -2.356 }, // Turn 135 degrees CW from last segment and move, passing 10 units along negated y-axis
  ],
  close: true,
})
```

**Example**

```js
// Example 5: Polyline with arcs (radius transitions)
api.v1.curve.advancedPolyline({
  id: shape5,
  pld: [
    { xa: 0, ya: 0 },
    { xa: 10, ya: 0, r: 2 }, // Arc transition to next segment
    { xa: 10, ya: 10 },
    { xa: 0, ya: 10, r: 3 }, // Arc transition back to start
  ],
  close: true,
})
```

**Example**

```js
// Example 6: Polyline with chamfer
api.v1.curve.advancedPolyline({
  id: shape6,
  pld: [
    { xa: 0, ya: 0 },
    { xa: 10, ya: 0, c: 5 }, // Cut away the angle, adding a line transition (chamfer) to next segment
    { xa: 10, ya: 10 },
    { xa: 0, ya: 10, c: 4 }, // Cut away the angle, adding a line transition (chamfer) to next segment
  ],
  close: true,
})
```

<a name="transformShape"></a>

## transformShape(param)

Transforms the given shape with a 4x4 tranformation matrix. The matrix is in coordinates of the part
where the provided shape belongs to.
Important:

- Left-handed transformation matrices are not yet supported
- Scaling part of the 4x4 matrix will be ignored.
- Matrices must be orthogonal

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
    result: VOID
    messages?: { message: string, level: real, code: real, api: string }[]
    maxLevel?: real
}
```

| Param        | Type                                                        | Description                                                                                                                                       |
| ------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| param        | <code>object</code>                                         | object containing all the parameters                                                                                                              |
| param.id     | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the shape to move                                                                                                                           |
| param.matrix | <code>Array&lt;Array&lt;real&gt;&gt;</code>                 | matrix to translate the shape to; matrix = [[[xVec:x,yVec:x,zVec:x,pos:x], [xVec:y,yVec:y,zVec:y,pos:y], [xVec:z,yVec:z,zVec:z,pos:z], [0,0,0,1]] |

**Example**

```js
api.v1.curve.transformShape({
  id: shape,
  matrix: [
    [0.0, 1.0, 0.0, 120.0],
    [-1.0, 0.0, 0.0, 40.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0],
  ],
})
```

<a name="scaleShape"></a>

## scaleShape(param)

Scales the given shape with a factor

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                                                        | Description                          |
| ------------ | ----------------------------------------------------------- | ------------------------------------ |
| param        | <code>object</code>                                         | object containing all the parameters |
| param.id     | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the shape to scale             |
| param.factor | <code>real</code>                                           | scale factor of the shape            |

**Example**

```js
api.v1.curve.scaleShape({ id: shape, factor: 3.5 })
```

<a name="cleanShape"></a>

## cleanShape(param)

Cleans the provided shapes, which means that the curves of the shapes will be deleted,
but not the shape itself. It can be used again for appending curves.

**Kind**: v1.curve function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param     | Type                                         | Description                                 |
| --------- | -------------------------------------------- | ------------------------------------------- |
| param     | <code>object</code>                          | object containing all the parameters        |
| param.ids | <code>Array&lt;(string\|real\|id)&gt;</code> | ids of the shapes to delete the curves from |

**Example**

```js
api.v1.curve.cleanShape({ ids: [52, 25, 68] })
```
