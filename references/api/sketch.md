<a name="create"></a>

## create(param)

Creates a new sketch and places it optionally on a face or work plane

- if planeId is a face, a new work plane on that face will be created
- if planeId is a workplane, the sketch will directly placed on it

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the new sketch
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param           | Type                                                        | Default                         | Description                                         |
| --------------- | ----------------------------------------------------------- | ------------------------------- | --------------------------------------------------- |
| param           | <code>object</code>                                         |                                 | object containing all the parameters                |
| param.id        | <code>string</code> \| <code>real</code> \| <code>id</code> |                                 | id of the part to create the sketch on              |
| [param.planeId] | <code>string</code> \| <code>real</code> \| <code>id</code> |                                 | id of the face or work plane to place the sketch on |
| [param.name]    | <code>string</code>                                         | <code>&quot;Sketch&quot;</code> | name of the sketch (default="Sketch")               |

**Example**

```js
api.v1.sketch.create({ id: part })
api.v1.sketch.create({ id: part, planeId: workPlane, name: 'Sketch_Top' })
```

<a name="setWorkPlane"></a>

## setWorkPlane(param)

Sets workplane for the sketch

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param         | Type                                                        | Description                               |
| ------------- | ----------------------------------------------------------- | ----------------------------------------- |
| param         | <code>object</code>                                         | object containing all the parameters      |
| param.id      | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch to set workplane for     |
| param.planeId | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the work plane to set the sketch on |

**Example**

```js
api.v1.sketch.setWorkPlane({ id: sketch, planeId: workPlane })
```

<a name="constraint"></a>

## constraint(param)

Creates one or multiple constraints in the sketch

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of created constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param         | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Description                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| param         | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | object or objects containing all the parameters                    |
| param.id      | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | id of the sketch to create constraints in                          |
| [param.name]  | <code>string</code>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | name of the constraint to create                                   |
| param.type    | <code>&quot;COINCIDENT&quot;</code> \| <code>&quot;COLINEAR&quot;</code> \| <code>&quot;CONCENTRIC&quot;</code> \| <code>&quot;EQUAL_LENGTH&quot;</code> \| <code>&quot;EQUAL_RADIUS&quot;</code> \| <code>&quot;FIXATION&quot;</code> \| <code>&quot;HORIZONTAL&quot;</code> \| <code>&quot;MIDPOINT&quot;</code> \| <code>&quot;PARALLEL&quot;</code> \| <code>&quot;PERPENDICULAR&quot;</code> \| <code>&quot;SPLINE_FIT_POINT&quot;</code> \| <code>&quot;SYMMETRY&quot;</code> \| <code>&quot;TANGENT&quot;</code> \| <code>&quot;VERTICAL&quot;</code> | type of the constraint to create                                   |
| param.geomIds | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | sketch geometry like points, curves, ... which will be constrained |

**Example**

```js
api.v1.sketch.constraint({ id: sketch, type: 'HORIZONTAL', geomIds: [pointId1, pointId2] })
api.v1.sketch.constraint({ id: sketch, type: 'VERTICAL', geomIds: [line] })
api.v1.sketch.constraint({ id: sketch, name: 'A', type: 'COINCIDENT', geomIds: [pointId1, pointId2] })
```

<a name="dimension"></a>

## dimension(param)

Creates one or multiple dimensional constraints in the sketch

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of created dimensional constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param          | Type                                                                                                                                                                                                                                                                        | Default            | Description                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| param          | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                                                                                                                     |                    | object or objects containing all the parameters                                                                                                 |
| param.id       | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                                                                                                                 |                    | id of the sketch to create dimensional constraints in                                                                                           |
| [param.name]   | <code>string</code>                                                                                                                                                                                                                                                         |                    | name of the constraint to create                                                                                                                |
| param.type     | <code>&quot;RADIUS&quot;</code> \| <code>&quot;DIAMETER&quot;</code> \| <code>&quot;OFFSET&quot;</code> \| <code>&quot;HORIZONTAL_DISTANCE&quot;</code> \| <code>&quot;VERTICAL_DISTANCE&quot;</code> \| <code>&quot;ANGLE&quot;</code> \| <code>&quot;ANGLEOX&quot;</code> |                    | type of the constraint to create                                                                                                                |
| [param.value]  | <code>real</code> \| <code>expression</code>                                                                                                                                                                                                                                |                    | value or expression to set for this dimensional constraint. If empty, value will be calculated automatically                                    |
| param.geomIds  | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                                                                                                                |                    | sketch geometry like points, curves, ... which will be constrained                                                                              |
| [param.dimPos] | [<code>point</code>](#point)                                                                                                                                                                                                                                                |                    | position of the dimension text, in case of type is "ANGLE", it also can be used to define which sector to be constrained                        |
| [param.reflex] | <code>boolean</code>                                                                                                                                                                                                                                                        | <code>FALSE</code> | If true, the angle will be the reflex angle in case of type is "ANGLE", which is bigger than 180deg, actually the outside angle (default=FALSE) |

**Example**

```js
api.v1.sketch.dimension({ id: sketch, type: 'ANGLE', geomIds: [873, 875], dimPos: [45, 80, 0], value: '60deg' })
api.v1.sketch.dimension({ id: sketch, type: 'OFFSET', geomIds: [line1, line2] })
```

<a name="sketchRegion"></a>

## sketchRegion(param)

Creates a sketch region for a given sketch from sketch geometry

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id  // id of the created sketch region
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param         | Type                                                        | Description                                                                                       |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| param         | <code>object</code>                                         | object containing all the parameters                                                              |
| param.id      | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch to create the sketch region                                                      |
| [param.name]  | <code>string</code>                                         | name of the sketch region                                                                         |
| param.geomIds | <code>Array&lt;(string\|real\|id)&gt;</code>                | sketch geometry that the new sketch region will consist of, all should belong to the given sketch |

**Example**

```js
api.v1.sketch.sketchRegion({ id: sketch, geomIds: [arc, line1, line2, line2] })
```

<a name="changeReferenceGeometry"></a>

## changeReferenceGeometry(param)

Re-links "Use"-Geometry in sketch - the same geometry will be connected to another reference

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                                                        | Description                                                      |
| ------------ | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| param        | <code>object</code>                                         | object containing all the parameters                             |
| param.id     | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch which the geometry belongs to                   |
| param.geomId | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch geometry that should be relinked                |
| param.refId  | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the new brep element to be referenced, like edge or vertex |

**Example**

```js
api.v1.sketch.changeReferenceGeometry({ id: sketch, geomId: circle, refId: edge })
```

<a name="circularPattern"></a>

## circularPattern(param)

Patterns a rigidset (or single object) in circular arrange/order

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
     constraint: id,
     dimension: id|VOID,
     geometry: Array<id>
  }
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param            | Type                                                        | Description                                                                             |
| ---------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| param            | <code>object</code>                                         | object containing all the parameters                                                    |
| param.id         | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch to create circular pattern in                                          |
| param.rigidSetId | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the rigid set to pattern                                                          |
| param.centerId   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the point to be used as an origin for rotation                                    |
| param.angle      | <code>real</code>                                           | angular offset in radians between neighbouring patterned objects around rotation center |
| param.count      | <code>real</code>                                           | number of copies                                                                        |

**Example**

```js
api.v1.sketch.circularPattern({ id: sketch, rigidSetId: rigidSet, centerId: id, angle: 1.57, count: 4 })
```

<a name="mirrorPattern"></a>

## mirrorPattern(param)

Patterns a rigidset (or single object) in mirror arrange/order

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
     constraint: id,
     geometry: Array<id>
  }
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                | Type                                                        | Description                                  |
| -------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| param                | <code>object</code>                                         | object containing all the parameters         |
| param.id             | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch to create mirror pattern in |
| param.rigidSetId     | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the rigid set to pattern               |
| param.symmetryLineId | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the line to be used as a symmetry line |

**Example**

```js
api.v1.sketch.mirrorPattern({ id: sketch, rigidSetId: rigidSet, symmetryLineId: line1 })
```

<a name="copyGeometry"></a>

## copyGeometry(param)

Copies sketch geometry

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id[]|VOID  // ids of copied objects
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                        | Default           | Description                                                                                   |
| ------------------------- | ----------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| param                     | <code>object</code>                                         |                   | object containing all the parameters                                                          |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the sketch to copy object                                                               |
| param.geomIds             | <code>Array&lt;(string\|real\|id)&gt;</code>                |                   | ids of the sketch geometry to copy                                                            |
| param.translation         | [<code>point</code>](#point)                                |                   | offset from initial objects as translation vector                                             |
| [param.doCopyConstraints] | <code>boolean</code>                                        | <code>TRUE</code> | a flag allowing to restrict copying constraints from original selected objects (default=TRUE) |

**Example**

```js
api.v1.sketch.copyGeometry({ id: sketch, geomIds: [line1, line2, line, arc], translation: [20, 30, 0] })
```

<a name="linearPattern"></a>

## linearPattern(param)

Patterns a rigidset (or single object) in linear/rectangular arrange/order. Copy count number over at least one dimension should be specified.

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
     constraint: id,
     dimensions: Array<id|VOID>,
     geometry: Array<id>
  }
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                        | Default        | Description                                                                   |
| ----------------- | ----------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------- |
| param             | <code>object</code>                                         |                | object containing all the parameters                                          |
| param.id          | <code>string</code> \| <code>real</code> \| <code>id</code> |                | id of the sketch to create linear pattern in                                  |
| param.rigidSetId  | <code>string</code> \| <code>real</code> \| <code>id</code> |                | id of the rigid set to pattern                                                |
| [param.xDistance] | <code>real</code>                                           | <code>0</code> | horizontal offset (x-axis) between neighbouring patterned objects (default=0) |
| [param.yDistance] | <code>real</code>                                           | <code>0</code> | vertical offset (y-axis) between neighbouring patterned objects (default=0)   |
| [param.xCount]    | <code>real</code>                                           | <code>1</code> | number of copies along the x-axis (default=1)                                 |
| [param.yCount]    | <code>real</code>                                           | <code>1</code> | number of copies along the y-axis (default=1)                                 |

**Example**

```js
api.v1.sketch.linearPattern({ id: sketch, rigidSetId: rigidSet, xCount: 5, xDistance: 30 })
api.v1.sketch.linearPattern({ id: sketch, rigidSetId: rigidSet, xCount: 3, xDistance: 50, yCount: 3, yDistance: 100 })
```

<a name="copyFrom"></a>

## copyFrom(param)

Copies the sketch geometry from one sketch to another

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param          | Type                                                        | Description                                               |
| -------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| param          | <code>object</code>                                         | object containing all the parameters                      |
| param.id       | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the existing sketch to copy sketch geometry into it |
| param.toCopyId | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch to copy elements from                    |

**Example**

```js
api.v1.sketch.copyFrom({ id: sketch1, toCopyId: sketch2 })
```

<a name="fillet"></a>

## fillet(param)

Creates a fillet in place of a point and its connecting two lines

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: Array<id>|VOID  // a tuple of (arcId, controlPointId, startPointId, endPointId) or VOID if fillet couldn't be created
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param          | Type                                                        | Description                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param          | <code>object</code>                                         | object containing all the parameters                                                                                                                                                            |
| param.id       | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch to create the fillet in                                                                                                                                                        |
| param.lineIds  | <code>Array&lt;(string\|real\|id)&gt;</code>                | ids of the two lines to create the fillet at its connecting point                                                                                                                               |
| [param.offset] | <code>real</code>                                           | offset from the incidence point to fillet arc start / end. If neither param.offset or param.radius are set, param.offset is taken 1/4 length of the shortest of lines referred in param.lineIds |
| [param.radius] | <code>real</code>                                           | radius of the fillet arc. Is ignored if param.offset is set                                                                                                                                     |

**Example**

```js
api.v1.sketch.fillet({ id: sketch, lineIds: [line1, line2], offset: 10 })
api.v1.sketch.fillet({ id: sketch, lineIds: [line1, line2], radius: 8 })
```

<a name="rectangle"></a>

## rectangle(param)

Creates a rectangle formed by two positions

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: Array<id>  // ids of the lines of the created rectangle
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

result information:

- index 0: horizontal line not connected to end position
- index 1: vertical line connected to end position
- index 2: horizontal line connected to end position
- index 3: vertical line not connected to end position

| Param                | Type                                                        | Default            | Description                                                                                                                                          |
| -------------------- | ----------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                | <code>object</code>                                         |                    | object containing all the parameters                                                                                                                 |
| param.id             | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the sketch to create the rectangle in                                                                                                          |
| param.startPos       | [<code>point</code>](#point)                                |                    | position of the first point to form the rectangle                                                                                                    |
| param.endPos         | [<code>point</code>](#point)                                |                    | position of the second point to form the rectangle                                                                                                   |
| [param.isCentered]   | <code>boolean</code>                                        | <code>FALSE</code> | a flag which defines if the rectangle is created as centered or not (default=FALSE)                                                                  |
| [param.genFixation]  | <code>boolean</code>                                        | <code>TRUE</code>  | a flag which defines if fixation in the Origin should be autogenerated or not (default=TRUE)                                                         |
| [param.genIncidence] | <code>boolean</code>                                        | <code>TRUE</code>  | a flag which defines if coincidence constraints between an existing point and the new rectangle corner should be autogenerated or not (default=TRUE) |
| [param.genTangency]  | <code>boolean</code>                                        | <code>TRUE</code>  | a flag which defines if tangency constraints between an existing arc and new rectangle should be autogenerated or not (default=TRUE)                 |

**Example**

```js
api.v1.sketch.rectangle({ id: sketch, startPos: [0, 0, 0], endPos: [20, 20, 0], isCentered: TRUE })
```

<a name="referenceGeometry"></a>

## referenceGeometry(param)

Creates new "Use"-Geometry in sketch. The sketch geometry will be created at the given brep elements
and projected into sketch plane. It also creates a reference to the given brep element.

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                 | Type                                                        | Default           | Description                                                            |
| --------------------- | ----------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------- |
| param                 | <code>object</code>                                         |                   | object containing all the parameters                                   |
| param.id              | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the sketch to create the reference geometry in                   |
| param.brepIds         | <code>Array&lt;(string\|real\|id)&gt;</code>                |                   | ids of the brep elements to create sketch geometry at and reference on |
| [param.keepReference] | <code>boolean</code>                                        | <code>TRUE</code> | a flag for maintaining the referencing (default=TRUE)                  |

**Example**

```js
api.v1.sketch.referenceGeometry({ id: sketch, brepIds: [edge1, edge2, edge] })
api.v1.sketch.referenceGeometry({ id: sketch, brepIds: [edge1], keepReference: FALSE })
```

<a name="rigidSet"></a>

## rigidSet(param)

Creates a rigid set from given sketch geometry in the sketch

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the created rigid set
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param         | Type                                                        | Description                                         |
| ------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| param         | <code>object</code>                                         | object containing all the parameters                |
| param.id      | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch to create the rigid set in         |
| param.geomIds | <code>Array&lt;(string\|real\|id)&gt;</code>                | ids of sketch geometry to create the rigid set from |

**Example**

```js
api.v1.sketch.rigidSet({ id: sketch, geomIds: [line1, arc, line2] })
```

<a name="undoFillet"></a>

## undoFillet(param)

Deletes an existing fillet by removing the arc and its constraints and connect lines again

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param       | Type                                                        | Description                              |
| ----------- | ----------------------------------------------------------- | ---------------------------------------- |
| param       | <code>object</code>                                         | object containing all the parameters     |
| param.id    | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch to delete the fillet in |
| param.arcId | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the fillet-made arc to delete      |

**Example**

```js
api.v1.sketch.undoFillet({ id: sketch, arcId: arc })
```

<a name="generateAutoConstraints"></a>

## generateAutoConstraints(param)

Automatically generates constraints whenever it makes sense and doesn't add up redundancy

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                   | Type                                                        | Default           | Description                                                                                                                                          |
| ----------------------- | ----------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                   | <code>object</code>                                         |                   | object containing all the parameters                                                                                                                 |
| param.id                | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the sketch to generat auto constraints                                                                                                         |
| param.geomId            | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the sketch geometry to auto constraint or the sketch id itself to autoconstraint each of sketch's objects                                      |
| [param.genFixation]     | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if fixation in the Origin should be autogenerated or not (default=TRUE)                                                         |
| [param.genIncidence]    | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if coincidence constraints between an existing point and the new rectangle corner should be autogenerated or not (default=TRUE) |
| [param.genTangency]     | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if tangency constraints between an existing arc and new rectangle should be autogenerated or not (default=TRUE)                 |
| [param.genVertAndHoriz] | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if vertical and horizontal constraints should be autogenerated or not (default=TRUE)                                            |

**Example**

```js
api.v1.sketch.generateAutoConstraints({ id: sketch, geomId: line })
```

<a name="loadFrom"></a>

## loadFrom(param)

Loads an ofb file by filename, data or url and copies the sketch geometry from loaded sketch to the existing sketch

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                        | Default                      | Description                                                                                           |
| ------------------- | ----------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                         |                              | object containing all the parameters                                                                  |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code> |                              | id of the sketch to copy sketch elements into it                                                      |
| param.partId        | <code>string</code> \| <code>real</code> \| <code>id</code> |                              | id of the part to load the sketch into                                                                |
| [param.url]         | <code>string</code>                                         |                              | url to loading ofb file, where the sketch want be loaded from                                         |
| [param.file]        | <code>string</code>                                         |                              | full path of the file. Path has to be a for the ClassCAD process reachable local or UNC path.         |
| [param.data]        | <code>string</code>                                         |                              | data/content of the model to load sketch from                                                         |
| [param.encoding]    | <code>&quot;base64&quot;</code>                             |                              | the encoding the data is encoded with. If compression is also set, the decoding happens first!        |
| [param.compression] | <code>&quot;deflate&quot;</code>                            |                              | the compression algorithm the data is compressed with.                                                |
| [param.format]      | <code>&quot;OFB&quot;</code>                                | <code>&quot;OFB&quot;</code> | content format of to load file, where the sketch want to be loaded from (default="OFB")               |
| [param.name]        | <code>string</code>                                         |                              | name of the sketch in the loaded ofb file, if no name is given, the first found sketch will be chosen |

**Example**

```js
api.v1.sketch.loadFrom({ id: sketch, partId: part, url: 'https://.../file.ofb', format: 'OFB' })
api.v1.sketch.loadFrom({ id: sketch, partId: part, file: '/var/models/file.ofb' })
api.v1.sketch.loadFrom({ id: sketch, partId: part, data: 'xx124b', format: 'OFB' })
```

<a name="moveGeometry"></a>

## moveGeometry(param)

Moves the given sketch geometry by translation vector

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: boolean  // true if sketch state is still solved
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                        | Description                                              |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| param             | <code>object</code>                                         | object containing all the parameters                     |
| param.id          | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch to move sketch geometry in              |
| param.geomIds     | <code>Array&lt;(string\|real\|id)&gt;</code>                | ids of the sketch geometry to move by translation vector |
| param.translation | [<code>point</code>](#point)                                | translation vector to move sketch geometry               |

**Example**

```js
api.v1.sketch.moveGeometry({ id: sketch, geomIds: [circle, line2], translation: [20, 85, 0] })
```

<a name="setReferences"></a>

## setReferences(param)

Creates and sets the plane, axis and origin reference of the sketch

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                        | Default            | Description                                                                                                                               |
| ------------------- | ----------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                         |                    | object containing all the parameters                                                                                                      |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the sketch to set the references                                                                                                    |
| [param.planeId]     | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of a face or a workplane. This will be the plane where the sketch lies on.                                                             |
| [param.invertPlane] | <code>boolean</code>                                        | <code>FALSE</code> | if true, the normal of the plane will be inverted (default=FALSE)                                                                         |
| [param.axisId]      | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of a line or a workaxis.                                                                                                               |
| [param.isXAxis]     | <code>boolean</code>                                        | <code>TRUE</code>  | if true, the axisId will be the x-axis of the sketch, else the x-Axis will be the crossvector of the normal and the axisId (default=TRUE) |
| [param.invertAxis]  | <code>boolean</code>                                        | <code>FALSE</code> | if true, the direction of the axis will be inverted (default=FALSE)                                                                       |
| [param.originId]    | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of a point or vertex of the sketch's origin reference                                                                                  |

**Example**

```js
api.v1.sketch.setReferences({ id: sketch, planeId: workPlane })
```

<a name="splitAllCurves"></a>

## splitAllCurves(param)

Splits all curves in the given sketch

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: Array<id|VOID> // Array of trimmable curves
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param    | Type                                                        | Description                          |
| -------- | ----------------------------------------------------------- | ------------------------------------ |
| param    | <code>object</code>                                         | object containing all the parameters |
| param.id | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch to split all curves |

**Example**

```js
api.v1.sketch.splitAllCurves({ id: sketch })
```

<a name="splitCurves"></a>

## splitCurves(param)

Splits curves in specified parameterized positions

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID|Array<Array<id|VOID>>
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

result information:

- VOID is returned if it isn't possible to split one or more specified entities.
- Otherwise, an array of same length as param.splits is returned.
- It contains arrays of ids of splitted curves in the same order as in param.splits.
- If the length of param.splits[i] was N, then the length of result[i] will be N+1.

| Param               | Type                                                        | Description                                                                                                                                                             |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                         | object containing all the parameters                                                                                                                                    |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch to split curves                                                                                                                                        |
| param.splits        | <code>Array&lt;object&gt;</code>                            | objects containing the split information                                                                                                                                |
| param.splits.geomId | <code>string</code> \| <code>real</code> \| <code>id</code> | id of curve to be split                                                                                                                                                 |
| param.splits.values | <code>Array&lt;real&gt;</code>                              | split values for the curve to be split. values are in range of [0,1]. value represents position on the curve from its start to the end (or from 0 to 2\*PI for circles) |

**Example**

```js
api.v1.sketch.splitCurves({ id: sketch, splits: [{ geomId: line, values: [0.236, 0.82345124] }] })
```

<a name="splitCurvesMergeBack"></a>

## splitCurvesMergeBack(param)

Merges the splitted curves back

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param    | Type                                                        | Description                                    |
| -------- | ----------------------------------------------------------- | ---------------------------------------------- |
| param    | <code>object</code>                                         | object containing all the parameters           |
| param.id | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch to merge back splitted curves |

**Example**

```js
api.v1.sketch.splitCurvesMergeBack({ id: sketch })
```

<a name="unlinkReferenceGeometry"></a>

## unlinkReferenceGeometry(param)

Unlinks "Use"-Geometry in sketch - sketch geometry still exists, but it is not connected to reference anymore

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                                                        | Description                                           |
| ------------ | ----------------------------------------------------------- | ----------------------------------------------------- |
| param        | <code>object</code>                                         | object containing all the parameters                  |
| param.id     | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch to unlink referenced sketch geometry |
| param.geomId | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch geometry to unlink                   |

**Example**

```js
api.v1.sketch.unlinkReferenceGeometry({ id: sketch, geomId: circle })
```

<a name="updateDimension"></a>

## updateDimension(param)

Updates the dimension of sketch geometry and recalculates the sketch

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: boolean  // true if sketch state is solved
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param       | Type                                                        | Description                                   |
| ----------- | ----------------------------------------------------------- | --------------------------------------------- |
| param       | <code>object</code>                                         | object containing all the parameters          |
| param.id    | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the dimension to update                 |
| param.value | <code>real</code> \| <code>expression</code>                | the new value or expression for the dimension |

**Example**

```js
api.v1.sketch.updateDimension({ id: dimension, value: 50 })
api.v1.sketch.updateDimension({ id: dimension, value: '@expr.distance1' })
```

<a name="updateGeometry"></a>

## updateGeometry(param)

Updates the sketch geometry

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                              | Type                                                        | Default           | Description                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| param                              | <code>object</code>                                         |                   | object containing all the parameters                                                                           |
| param.id                           | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the sketch to update sketch geometry                                                                     |
| [param.points]                     | <code>Array&lt;object&gt;</code>                            |                   | array of points to create                                                                                      |
| param.points[].id                  | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the point to update                                                                                      |
| param.points[].pos                 | [<code>point</code>](#point)                                |                   | new position of the point                                                                                      |
| [param.lines]                      | <code>Array&lt;object&gt;</code>                            |                   | array of lines to create                                                                                       |
| param.lines[].id                   | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the line to update                                                                                       |
| param.lines[].startPos             | [<code>point</code>](#point)                                |                   | new start position of the line                                                                                 |
| param.lines[].endPos               | [<code>point</code>](#point)                                |                   | new end position of the line                                                                                   |
| [param.arcsBy3Points]              | <code>Array&lt;object&gt;</code>                            |                   | array of arcs to create by three given points                                                                  |
| param.arcsBy3Points[].id           | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the arc to update by 3 points                                                                            |
| param.arcsBy3Points[].startPos     | [<code>point</code>](#point)                                |                   | start position of the arc                                                                                      |
| param.arcsBy3Points[].endPos       | [<code>point</code>](#point)                                |                   | end position of the arc                                                                                        |
| param.arcsBy3Points[].midPos       | [<code>point</code>](#point)                                |                   | middle position on the arc (not center)                                                                        |
| [param.arcsByCenter]               | <code>Array&lt;object&gt;</code>                            |                   | array of arcs to create by start-, end- and center point                                                       |
| param.arcsByCenter[].id            | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the arc to update by center                                                                              |
| param.arcsByCenter[].startPos      | [<code>point</code>](#point)                                |                   | start position of the arc                                                                                      |
| param.arcsByCenter[].endPos        | [<code>point</code>](#point)                                |                   | end position of the arc                                                                                        |
| param.arcsByCenter[].centerPos     | [<code>point</code>](#point)                                |                   | center position of the arc                                                                                     |
| [param.arcsByCenter[].isClockwise] | <code>boolean</code>                                        | <code>TRUE</code> | flag to define whether the arc is clockwise from start- to end-point around center-point or not (default=TRUE) |
| [param.circles]                    | <code>Array&lt;object&gt;</code>                            |                   | array of circles to create                                                                                     |
| param.circles[].id                 | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the circle to update                                                                                     |
| param.circles[].centerPos          | [<code>point</code>](#point)                                |                   | center position of the circle                                                                                  |
| param.circles[].radius             | <code>real</code>                                           |                   | radius of the circle                                                                                           |

**Example**

```js
api.v1.sketch.updateGeometry({
  id: sketch,
  points: [
    { id: pointId1, pos: [10, 50, 0] },
    { id: pointId2, pos: [10, 60, 0] },
  ],
})
api.v1.sketch.updateGeometry({ id: sketch, circles: [{ id: circle, centerPos: [40, 50, 0], radius: 15 }] })
```

<a name="updateSketchRegion"></a>

## updateSketchRegion(param)

Updates sketch regions with new sketch geometry

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                 | Type                                                        | Description                                                  |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| param                 | <code>object</code>                                         | object containing all the parameters                         |
| param.regions         | <code>Array&lt;object&gt;</code>                            | array of objects containing update informaton for the region |
| param.regions.id      | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch region to update                            |
| param.regions.geomIds | <code>Array&lt;(string\|real\|id)&gt;</code>                | array or sketch geometry to update the region with           |

**Example**

```js
api.v1.sketch.updateSketchRegion({ regions: [{ id: sketchRegion, geomIds: [line1, line2, line] }] })
```

<a name="getPoints"></a>

## getPoints(param)

Get the specific point ids of lines, arcs or circles

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: { startId: string|real|id, endId: string|real|id } |
     { startId: string|real|id, endId: string|real|id, centerId: string|real|id } |
     { centerId: string|real|id } |
     VOID  // object containing the specific points, which define the geometry which has been provided
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

result information:

- if input is a line then it returns an object containing startId and endId of the line
- if input is an arc then it returns an object containing startId, endId and centerId of the arc
- if input is a circle then it returns an object containing centerId of the circle

| Param    | Type                                                        | Description                                                                    |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| param    | <code>object</code>                                         | object containing the parameters                                               |
| param.id | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the geometry (e.g. line, arc, circle) to get the specific point ids from |

**Example**

```js
api.v1.sketch.getPoints({ id: lineId })
```

<a name="getPositions"></a>

## getPositions(param)

Get the specific positions of points, lines, arcs or circles

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: { pos: point } |
     { startPos: point, endPos: point } |
     { startPos: point, endPos: point, centerPos: point } |
     { centerPos: point } |
     VOID  // object containing the specific positions
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

result information:

- if input is a point then it returns an object containing position of the point
- if input is a line then it returns an object containing start- and end-position of the line
- if input is an arc then it returns an object containing start-, end- and center-position of the arc
- if input is a circle then it returns an object containing center-position of the circle

| Param    | Type                                                        | Description                                                                           |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| param    | <code>object</code>                                         | object containing the parameters                                                      |
| param.id | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the geometry (e.g. point, line, arc, circle) to get the specific positions from |

**Example**

```js
api.v1.sketch.getPositions({ id: lineId })
```

<a name="point"></a>

## point(param)

Creates one or multiple points in the sketch

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the added points
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                | Type                                                        | Default           | Description                                                                                                                         |
| -------------------- | ----------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| param                | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                   | object or objects containing all the parameters                                                                                     |
| param.id             | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the sketch                                                                                                                    |
| param.pos            | [<code>point</code>](#point)                                |                   | position of the point                                                                                                               |
| [param.genFixation]  | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if fixation in the Origin should be autogenerated or not (default=TRUE)                                        |
| [param.genIncidence] | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if coincidence constraints between an existing and the new point should be autogenerated or not (default=TRUE) |

**Example**

```js
api.v1.sketch.point({ id: sketch, pos: [0, 0, 0] })
```

<a name="line"></a>

## line(param)

Creates one or multiple lines in the sketch

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the added lines
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                   | Type                                                        | Default           | Description                                                                                                                           |
| ----------------------- | ----------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| param                   | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                   | object or objects containing all the parameters                                                                                       |
| param.id                | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the sketch                                                                                                                      |
| param.startPos          | [<code>point</code>](#point)                                |                   | start position of the line                                                                                                            |
| param.endPos            | [<code>point</code>](#point)                                |                   | end position of the line                                                                                                              |
| [param.genFixation]     | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if fixation in the Origin should be autogenerated or not (default=TRUE)                                          |
| [param.genIncidence]    | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if coincidence constraints between an existing and the new point should be autogenerated or not (default=TRUE)   |
| [param.genTangency]     | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if tangency constraints between an existing curve and the new line should be autogenerated or not (default=TRUE) |
| [param.genVertAndHoriz] | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if vertical and horizontal constraints should be autogenerated or not (default=TRUE)                             |

**Example**

```js
api.v1.sketch.line({ id: sketch, startPos: [0, 0, 0], endPos: [10, 10, 0] })
```

<a name="circle"></a>

## circle(param)

Creates one or multiple circles in the sketch

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the added circles
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                | Type                                                        | Default           | Description                                                                                                                         |
| -------------------- | ----------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| param                | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                   | object or objects containing all the parameters                                                                                     |
| param.id             | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the sketch                                                                                                                    |
| param.centerPos      | [<code>point</code>](#point)                                |                   | center position of the circle                                                                                                       |
| param.radius         | <code>real</code>                                           |                   | radius of the circle                                                                                                                |
| [param.genFixation]  | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if fixation in the origin should be autogenerated or not (default=TRUE)                                        |
| [param.genIncidence] | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if coincidence constraints between an existing and the new point should be autogenerated or not (default=TRUE) |

**Example**

```js
api.v1.sketch.circle({ id: sketch, centerPos: [40, 0, 0], radius: 20 })
```

<a name="getGeometry"></a>

## getGeometry(param)

Get all the sketch geometry from a sketch, sketch region or rigid set

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: { points: id[], lines: id[], arcs: id[], circles: id[] }  // object containing the sketch geometry
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param    | Type                                                        | Description                                  |
| -------- | ----------------------------------------------------------- | -------------------------------------------- |
| param    | <code>object</code>                                         | object containing the parameters             |
| param.id | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch, sketch region or rigid set |

**Example**

```js
api.v1.sketch.getGeometry({ id: sketchRegion })
```

<a name="arcByCenter"></a>

## arcByCenter(param)

Creates one or multiple arcs by center in the sketch. Arc is defined by start-, end- and center-position.

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the added arcs
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                | Type                                                        | Default           | Description                                                                                                                         |
| -------------------- | ----------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| param                | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                   | object or objects containing all the parameters                                                                                     |
| param.id             | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the sketch                                                                                                                    |
| param.startPos       | [<code>point</code>](#point)                                |                   | start position of the arc                                                                                                           |
| param.endPos         | [<code>point</code>](#point)                                |                   | end position of the arc                                                                                                             |
| param.centerPos      | [<code>point</code>](#point)                                |                   | center position of the arc                                                                                                          |
| [param.isClockwise]  | <code>boolean</code>                                        | <code>TRUE</code> | flag to define whether the arc is clockwise from start- to end-point around center-point or not (default=TRUE)                      |
| [param.genFixation]  | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if fixation in the origin should be autogenerated or not (default=TRUE)                                        |
| [param.genIncidence] | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if coincidence constraints between an existing and the new point should be autogenerated or not (default=TRUE) |

**Example**

```js
api.v1.sketch.arcByCenter({ id: sketch, startPos: [-40, 0, 0], centerPos: [0, 10, 0], endPos: [40, 0, 0] })
```

<a name="arcBy3Points"></a>

## arcBy3Points(param)

Creates one or multiple arcs by 3 points in the sketch. Arc is defined by start-, end- and mid-position.

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the added arcs
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                | Type                                                        | Default            | Description                                                                                                                             |
| -------------------- | ----------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| param                | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                    | object or objects containing all the parameters                                                                                         |
| param.id             | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the sketch                                                                                                                        |
| param.startPos       | [<code>point</code>](#point)                                |                    | start position of the arc                                                                                                               |
| param.endPos         | [<code>point</code>](#point)                                |                    | end position of the arc                                                                                                                 |
| param.midPos         | [<code>point</code>](#point)                                |                    | middle position on the arc                                                                                                              |
| [param.genFixation]  | <code>boolean</code>                                        | <code>TRUE</code>  | a flag which defines if fixation in the origin should be autogenerated or not (default=TRUE)                                            |
| [param.genIncidence] | <code>boolean</code>                                        | <code>TRUE</code>  | a flag which defines if coincidence constraints between an existing and the new point should be autogenerated or not (default=TRUE)     |
| [param.genTangency]  | <code>boolean</code>                                        | <code>FALSE</code> | a flag which defines if tangency constraints between an existing curve and the new curve should be autogenerated or not (default=FALSE) |

**Example**

```js
api.v1.sketch.arcBy3Points({ id: sketch, startPos: [0, 0, 0], midPos: [20, 20, 0], endPos: [40, 0, 0] })
api.v1.sketch.arcBy3Points({ id: sketch, startPos: [0, 0, 0], midPos: [20, 20, 0], endPos: [40, 0, 0], genTangency: TRUE })
```

<a name="geometry"></a>

## geometry(param)

Creates one or multiple sketch geometry in the sketch

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: { points: id[], lines: id[], arcsBy3Points: id[],
     arcsByCenter: id[], circles: id[] }  // object containing created sketch geometry in the order of input
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                              | Type                                                        | Default           | Description                                                                                                                               |
| ---------------------------------- | ----------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| param                              | <code>object</code>                                         |                   | object containing all the parameters                                                                                                      |
| param.id                           | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the sketch                                                                                                                          |
| [param.points]                     | <code>Array&lt;object&gt;</code>                            |                   | array of points to create                                                                                                                 |
| param.points[].pos                 | [<code>point</code>](#point)                                |                   | position of the point                                                                                                                     |
| [param.lines]                      | <code>Array&lt;object&gt;</code>                            |                   | array of lines to create                                                                                                                  |
| param.lines[].startPos             | [<code>point</code>](#point)                                |                   | start position of the line                                                                                                                |
| param.lines[].endPos               | [<code>point</code>](#point)                                |                   | end position of the line                                                                                                                  |
| [param.arcsBy3Points]              | <code>Array&lt;object&gt;</code>                            |                   | array of arcs to create by three given points                                                                                             |
| param.arcsBy3Points[].startPos     | [<code>point</code>](#point)                                |                   | start position of the arc                                                                                                                 |
| param.arcsBy3Points[].endPos       | [<code>point</code>](#point)                                |                   | end position of the arc                                                                                                                   |
| param.arcsBy3Points[].midPos       | [<code>point</code>](#point)                                |                   | middle position on the arc (not center)                                                                                                   |
| [param.arcsByCenter]               | <code>Array&lt;object&gt;</code>                            |                   | array of arcs to create by start-, end- and center point                                                                                  |
| param.arcsByCenter[].startPos      | [<code>point</code>](#point)                                |                   | start position of the arc                                                                                                                 |
| param.arcsByCenter[].endPos        | [<code>point</code>](#point)                                |                   | end position of the arc                                                                                                                   |
| param.arcsByCenter[].centerPos     | [<code>point</code>](#point)                                |                   | center position of the arc                                                                                                                |
| [param.arcsByCenter[].isClockwise] | <code>boolean</code>                                        | <code>TRUE</code> | flag to define whether the arc is clockwise from start- to end-point around center-point or not (default=TRUE)                            |
| [param.circles]                    | <code>Array&lt;object&gt;</code>                            |                   | array of circles to create                                                                                                                |
| param.circles[].centerPos          | [<code>point</code>](#point)                                |                   | center position of the circle                                                                                                             |
| param.circles[].radius             | <code>real</code>                                           |                   | radius of the circle                                                                                                                      |
| [param.genFixation]                | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if fixation in the Origin should be autogenerated or not (default=TRUE)                                              |
| [param.genIncidence]               | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if coincidence constraints between an existing point and the new point should be autogenerated or not (default=TRUE) |
| [param.genTangency]                | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if tangency constraints between an existing curve and the new curve should be autogenerated or not (default=TRUE)    |
| [param.genVertAndHoriz]            | <code>boolean</code>                                        | <code>TRUE</code> | a flag which defines if vertical and horizontal constraints should be autogenerated or not (default=TRUE)                                 |

**Example**

```js
api.v1.sketch.geometry({ id: sketch, points: [{ pos: [0, 0, 0] }, { pos: [10, 10, 0] }, { pos: [20, 0, 0] }] })
api.v1.sketch.geometry({ id: sketch, lines: [{ startPos: [0, 0, 0], endPos: [0, 20, 0] }] })
api.v1.sketch.geometry({ id: sketch, arcsBy3Points: [{ startPos: [0, 20, 0], endPos: [20, 20, 0], midPos: [10, 30, 0] }] })
api.v1.sketch.geometry({
  id: sketch,
  arcsByCenter: [{ startPos: [0, 20, 0], endPos: [20, 20, 0], centerPos: [10, 20, 0], isClockwise: FALSE }],
})
api.v1.sketch.geometry({
  id: sketch,
  circles: [
    { centerPos: [0, 20, 0], radius: 20 },
    { centerPos: [0, 40, 0], radius: 10 },
  ],
})
```

<a name="deleteObject"></a>

## deleteObject(param)

Deletes dimensions, constraints, sketch geometry, sketch region or rigid sets from sketch

**Kind**: v1.sketch function  
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
| param.ids | <code>Array&lt;(string\|real\|id)&gt;</code> | ids to delete                        |

**Example**

```js
api.v1.sketch.deleteObject({ ids: [15, 25, 23] })
```

<a name="deleteSketch"></a>

## deleteSketch(param)

Deletes existing sketches

**Kind**: v1.sketch function  
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
| param.ids | <code>Array&lt;(string\|real\|id)&gt;</code> | ids of the sketches to delete        |

**Example**

```js
api.v1.sketch.deleteSketch({ ids: [6, 8] })
```

<a name="getSketchRegion"></a>

## getSketchRegion(param)

Returns the id of the sketch region with the given name which belongs to the given sketch id.

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the found sketch region
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                    |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------- |
| param      | <code>object</code>                                         | object containing all the parameters           |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch to get the sketch region from |
| param.name | <code>string</code>                                         | the name of the sketch region to look for      |

**Example**

```js
api.v1.sketch.getSketchRegion({ id: sketch, name: 'SketchRegion_Left' })
```

<a name="trimCurves"></a>

## trimCurves(param)

Trims away curves, if they are suitable for trimming

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param          | Type                                                        | Description                                     |
| -------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| param          | <code>object</code>                                         | object containing all the parameters            |
| param.id       | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sketch with curves to be trimmed away |
| param.curveIds | <code>Array&lt;(string\|real\|id)&gt;</code>                | ids of sketch curves to be trimmed away         |

**Example**

```js
api.v1.sketch.trimCurves({ id: sketch, curveIds: [circle, line] })
```

<a name="updateDimensionPosition"></a>

## updateDimensionPosition(param)

Updates the position of the dimension text

**Kind**: v1.sketch function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param     | Type                                                        | Description                                     |
| --------- | ----------------------------------------------------------- | ----------------------------------------------- |
| param     | <code>object</code>                                         | object containing all the parameters            |
| param.id  | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the dimension to change the text position |
| param.pos | [<code>point</code>](#point)                                | position of the dimension text to update        |

**Example**

```js
api.v1.sketch.updateDimensionPosition({ id: dimension, pos: [50, 60, 0] })
```
