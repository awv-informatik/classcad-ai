<a name="boolean"></a>

## boolean(param)

Creates a boolean feature.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the boolean feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                   | Type                                                                                                            | Default                        | Description                                                                                                                                                                                                                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                   | <code>object</code>                                                                                             |                                | object containing the parameters                                                                                                                                                                                                                                                                           |
| param.id                | <code>string</code> \| <code>real</code> \| <code>id</code>                                                     |                                | id of the part to create boolean feature in                                                                                                                                                                                                                                                                |
| [param.name]            | <code>string</code>                                                                                             |                                | name of the boolean feature (default="Union" or "Subtraction" or "Intersection") depends on the type                                                                                                                                                                                                       |
| [param.type]            | <code>&quot;UNION&quot;</code> \| <code>&quot;SUBTRACTION&quot;</code> \| <code>&quot;INTERSECTION&quot;</code> | <code>&quot;UNION&quot;</code> | type of the boolean operation (default="UNION") - "UNION": all the solids will be unified to one solid - "SUBTRACTION": all the solids will be subtracted from the first one in the array - "INTERSECTION": all the solids will be intersected with the first or the result solid of previous intersection |
| param.target            | <code>string</code> \| <code>real</code> \| <code>id</code> \| <code>object</code>                              |                                | target as id of the feature to use for this boolean feature or as object containing an id and optional indices                                                                                                                                                                                             |
| param.target.id         | <code>string</code> \| <code>real</code> \| <code>id</code>                                                     |                                | id of the feature, to use as base feature for this boolean operation                                                                                                                                                                                                                                       |
| [param.target.indices]  | <code>Array&lt;real&gt;</code>                                                                                  |                                | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this boolean                                                                                                                                                         |
| param.tools             | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code>                                |                                | tools as ids of the features to use for this boolean feature or as objects containing an id and optional indices                                                                                                                                                                                           |
| param.tools[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                                                     |                                | id of the feature, to use as tool feature for this boolean operation                                                                                                                                                                                                                                       |
| [param.tools[].indices] | <code>Array&lt;real&gt;</code>                                                                                  |                                | if more than one solid is appended to the tool feature, the indices can be used to specifiy which solids of the feature be used for this boolean                                                                                                                                                           |

**Example**

```js
api.v1.part.boolean({ id: part, target: feature, tools: [{ id: pattern, indices: [2] }] })
```

<a name="box"></a>

## box(param)

Creates or updates a box feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the box feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                        | Default                      | Description                                                                                       |
| ------------------ | ----------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                         |                              | object containing the parameters                                                                  |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code> |                              | id of the part to create box feature in                                                           |
| [param.name]       | <code>string</code>                                         | <code>&quot;Box&quot;</code> | name of the box feature (default="Box")                                                           |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                |                              | reference of the work coordinate system. If void or empty array, box is placed at drawing origin. |
| [param.length]     | <code>real</code> \| [<code>expression</code>](#expression) | <code>100</code>             | length of the box in x-direction (default=100)                                                    |
| [param.width]      | <code>real</code> \| [<code>expression</code>](#expression) | <code>100</code>             | width of the box in y-direction (default=100)                                                     |
| [param.height]     | <code>real</code> \| [<code>expression</code>](#expression) | <code>100</code>             | height of the box in z-direction (default=100)                                                    |

**Example**

```js
api.v1.part.box({ id: part, name: 'BoxTop', references: [wcs] })
api.v1.part.box({ id: part, name: 'BoxTop', references: [wcs], height: '3*65' })
```

<a name="calculateMassProperties"></a>

## calculateMassProperties(param)

Calculates the center of gravity (cog) and the volume of the given object.
Depending on the input parameter the calculations were made
on a single solid, a part, a subassembly, the whole model, ...
E.g. the center of gravity of a root assembly, will be the sum of all solid's center of gravity
over the whole assembly structure. If a solid is given, the center of gravity will be local to its part.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: { cog: point, volume: real } | VOID  // object containing the center of gravity and the volume
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param    | Type                                                        | Description                                      |
| -------- | ----------------------------------------------------------- | ------------------------------------------------ |
| param    | <code>object</code>                                         | object containing the parameters                 |
| param.id | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the object to get the mass properties from |

**Example**

```js
api.v1.part.calculateMassProperties({ id: part })
```

<a name="chamfer"></a>

## chamfer(param)

Creates a chamfer feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the chamfer feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                                                                                         | Default                                 | Description                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| param             | <code>object</code>                                                                                                          |                                         | object containing the parameters                                  |
| param.id          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                  |                                         | id of the part to create chamfer feature in                       |
| [param.name]      | <code>string</code>                                                                                                          | <code>&quot;Chamfer&quot;</code>        | name of the chamfer feature (default="Chamfer")                   |
| param.references  | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                 |                                         | selected brep edges to create chamfer on                          |
| [param.type]      | <code>&quot;EQUAL_DISTANCE&quot;</code> \| <code>&quot;TWO_DISTANCES&quot;</code> \| <code>&quot;DISTANCE_ANGLE&quot;</code> | <code>&quot;EQUAL_DISTANCE&quot;</code> | type of the chamfer (default="EQUAL_DISTANCE")                    |
| [param.distance1] | <code>real</code> \| [<code>expression</code>](#expression)                                                                  | <code>2</code>                          | distance1 of the chamfer (default=2) for all types                |
| [param.distance2] | <code>real</code> \| [<code>expression</code>](#expression)                                                                  | <code>2</code>                          | distance2 of the chamfer (default=2) for type = "TWO_DISTANCES"   |
| [param.angle]     | <code>real</code> \| [<code>expression</code>](#expression)                                                                  | <code>C:PI/4</code>                     | angle of the chamfer (default=C:PI/4) for type = "DISTANCE_ANGLE" |

**Example**

```js
api.v1.part.chamfer({ id: part, name: 'ChamferTop', references: [edge1, edge2, edge3] })
api.v1.part.chamfer({ id: part, type: 'DISTANCE_ANGLE', references: [edge], distance1: 10, angle: 'C:PI/6' })
```

<a name="circularPattern"></a>

## circularPattern(param)

Creates a circular pattern feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the circular pattern feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Default                                  | Description                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code>                                                              |                                          | object containing the parameters                                                                                                                  |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                          | id of the part to create circular pattern feature in                                                                                              |
| [param.name]              | <code>string</code>                                                              | <code>&quot;CircularPattern&quot;</code> | name of the mirror feature (default="CircularPattern")                                                                                            |
| param.targets             | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> |                                          | targets as ids of the features to use for this circular pattern feature or as objects containing an id and optional indices                       |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                          | id of the feature, to use for this circular pattern                                                                                               |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   |                                          | if more than one solid is appended to the feature, the indices can be used to select the solids                                                   |
| param.references          | <code>Array&lt;(string\|real\|id)&gt;</code>                                     |                                          | selected line (brep-edge, sketch-line or work-axis) or points (brep-vertex, sketch-point or work-point) defining the axis of the circular pattern |
| [param.inverted]          | [<code>boolean</code>](#boolean)                                                 | <code>FALSE</code>                       | if true, the rotation around axis of the pattern will be inverted (default=FALSE)                                                                 |
| [param.angle]             | <code>real</code> \| [<code>expression</code>](#expression)                      | <code>0</code>                           | angle between entities around axis of circular pattern (default=0)                                                                                |
| [param.count]             | <code>real</code> \| [<code>expression</code>](#expression)                      | <code>2</code>                           | number of entities around axis of circular pattern (default=2)                                                                                    |
| [param.merged]            | [<code>boolean</code>](#boolean)                                                 | <code>FALSE</code>                       | if true, entities of the circular pattern will be merged to one entity (default=FALSE)                                                            |

**Example**

```js
api.v1.part.circularPattern({ id: part, targets: [{ id: feature }], references: [15], angle: 0.785, count: 8, merged: FALSE })
```

<a name="closeFeature"></a>

## closeFeature(param)

Moves GhostRollbackBar back to RollbackBar, sets relevant entities' visibility.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param    | Type                                                        | Description                          |
| -------- | ----------------------------------------------------------- | ------------------------------------ |
| param    | <code>object</code>                                         | object containing all the parameters |
| param.id | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the feature to close           |

**Example**

```js
api.v1.part.closeFeature({ id: feature })
```

<a name="compositeCurve"></a>

## compositeCurve(param)

Creates a composite curve feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the composite curve feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param            | Type                                                        | Default                                 | Description                                                                 |
| ---------------- | ----------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| param            | <code>object</code>                                         |                                         | object containing the parameters                                            |
| param.id         | <code>string</code> \| <code>real</code> \| <code>id</code> |                                         | id of the part to create composite curve feature in                         |
| [param.name]     | <code>string</code>                                         | <code>&quot;CompositeCurve&quot;</code> | name of the composite curve feature (default="CompositeCurve")              |
| param.references | <code>Array&lt;(string\|real\|id)&gt;</code>                |                                         | selected curves (sketch-curve, brep-edge) to build the composite curve from |

**Example**

```js
api.v1.part.compositeCurve({ id: part, references: curves })
```

<a name="cone"></a>

## cone(param)

Creates a cone feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the cone feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                        | Default                       | Description                                                                                        |
| ------------------ | ----------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                         |                               | object containing the parameters                                                                   |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code> |                               | id of the part to create cone feature in                                                           |
| [param.name]       | <code>string</code>                                         | <code>&quot;Cone&quot;</code> | name of the cone feature (default="Cone")                                                          |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                |                               | reference of the work coordinate system. If void or empty array, cone is placed at drawing origin. |
| [param.bDiameter]  | <code>real</code> \| [<code>expression</code>](#expression) | <code>50</code>               | diameter at the bottom of the cone (default=50)                                                    |
| [param.tDiameter]  | <code>real</code> \| [<code>expression</code>](#expression) | <code>0.1</code>              | diameter at the top of the cone (default=0.1)                                                      |
| [param.height]     | <code>real</code> \| [<code>expression</code>](#expression) | <code>100</code>              | height of the cone (z-direction) (default=100)                                                     |

**Example**

```js
api.v1.part.cone({ id: part, name: 'ConeLeft', references: [52] })
api.v1.part.cone({ id: part, references: [52], height: '3*diameter' })
```

<a name="create"></a>

## create([param])

Clears the drawing and creates a new part

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the new part
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                | Default                       | Description                          |
| ------------ | ------------------- | ----------------------------- | ------------------------------------ |
| [param]      | <code>object</code> |                               | object containing all the parameters |
| [param.name] | <code>string</code> | <code>&quot;Part&quot;</code> | name of the part (default="Part")    |

**Example**

```js
api.v1.part.create({ name: 'NewPart' })
```

<a name="createUncommitedObject"></a>

## createUncommitedObject(param)

Attention: This method should only be used, if the intention is very clear.
Creates a new uncommited (empty) feature in the given part.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the created object
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                       |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------- |
| param      | <code>object</code>                                         | object containing all the parameters              |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the part to create the uncommited object in |
| param.type | <code>string</code>                                         | the type of object to be created                  |
| param.name | <code>string</code>                                         | the name of the object to be created              |

**Example**

```js
api.v1.part.createUncommitedObject({ id: part, type: 'CC_Box', name: 'Box' })
```

<a name="cylinder"></a>

## cylinder(param)

Creates a cylinder feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the cylinder feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                        | Default                           | Description                                                                                            |
| ------------------ | ----------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| param              | <code>object</code>                                         |                                   | object containing the parameters                                                                       |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code> |                                   | id of the part to create cylinder feature in                                                           |
| [param.name]       | <code>string</code>                                         | <code>&quot;Cylinder&quot;</code> | name of the cylinder feature (default="Cylinder")                                                      |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                |                                   | reference of the work coordinate system. If void or empty array, cylinder is placed at drawing origin. |
| [param.diameter]   | <code>real</code> \| [<code>expression</code>](#expression) | <code>100</code>                  | diameter of the cylinder (default=100)                                                                 |
| [param.height]     | <code>real</code> \| [<code>expression</code>](#expression) | <code>100</code>                  | height of the cylinder in z-direction (default=100)                                                    |

**Example**

```js
api.v1.part.cylinder({ id: part, name: 'Cyl', references: [52] })
api.v1.part.cylinder({ id: part, references: [52], height: '2*diam' })
```

<a name="deleteExpression"></a>

## deleteExpression(param)

Deletes expressions in different products

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: boolean  // true if everything is fine, false if deletion was not successful
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param            | Type                                                        | Description                                                                |
| ---------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| param            | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters                                |
| param.id         | <code>string</code> \| <code>real</code> \| <code>id</code> | id or identifier of the product where the expressions wanted to be deleted |
| [param.toDelete] | <code>Array&lt;string&gt;</code>                            | array with names of expressions to be deleted                              |

**Example**

```js
api.v1.part.deleteExpression({ id: part, toDelete: ['width', 'size'] })
```

<a name="deleteFeature"></a>

## deleteFeature(param)

Deletes existing features, work geometries and sketches

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param     | Type                                         | Description                                                |
| --------- | -------------------------------------------- | ---------------------------------------------------------- |
| param     | <code>object</code>                          | object containing all the parameters                       |
| param.ids | <code>Array&lt;(string\|real\|id)&gt;</code> | ids of the features, work geometries or sketches to delete |

**Example**

```js
api.v1.part.deleteFeature({ ids: [15] })
```

<a name="entityDeletion"></a>

## entityDeletion(param)

Creates a entity deletion feature.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the entitiy deletion feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Default                                 | Description                                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code>                                                              |                                         | object containing the parameters                                                                                                                           |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                         | id of the part to create entity deletion feature in                                                                                                        |
| [param.name]              | <code>string</code>                                                              | <code>&quot;EntityDeletion&quot;</code> | name of the entity deletion feature (default="EntityDeletion")                                                                                             |
| param.targets             | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> |                                         | targets as ids of the features to use for this entity deletion feature or as objects containing an id and optional indices                                 |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                         | id of the feature, to use for this deletion feature                                                                                                        |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   |                                         | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this entity deletion |

**Example**

```js
api.v1.part.entityDeletion({ id: part, targets: [{ id: pattern, indices: [0, 2, 4] }] })
```

<a name="entityInjection"></a>

## entityInjection(param)

Creates a new entity injection. This feature can be used to inject entities like solids or curves
into a part, created with the Solid- and CurveAPI.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the entity injection
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                                                        | Default                                  | Description                                                      |
| ------------ | ----------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| param        | <code>object</code>                                         |                                          | object containing the parameters                                 |
| [param.id]   | <code>string</code> \| <code>real</code> \| <code>id</code> |                                          | id of the part to create entity injection in                     |
| [param.name] | <code>string</code>                                         | <code>&quot;EntityInjection&quot;</code> | name of the entity injection feature (default="EntityInjection") |

**Example**

```js
api.v1.part.entityInjection({ id: part })
```

<a name="expression"></a>

## expression(param)

Creates expressions in different products

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: boolean  // true if everything is fine, false if adding expression was not successful
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                | Type                                                        | Description                                                                |
| -------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| param                | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters                                |
| param.id             | <code>string</code> \| <code>real</code> \| <code>id</code> | id or identifier of the product where the expressions wanted to be created |
| [param.toCreate]     | <code>Array&lt;object&gt;</code>                            | array of expressions to be created                                         |
| param.toCreate.name  | <code>string</code>                                         | name of the expression to create                                           |
| param.toCreate.value | <code>real</code> \| <code>string</code>                    | value of to create expression                                              |

**Example**

```js
api.v1.part.expression({ id: part, toCreate: [{ name: 'height', value: 50 }] })
```

<a name="extrusion"></a>

## extrusion(param)

Creates an extrusion feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the extrusion feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                                                                                                  | Default                            | Description                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                                                                                                   |                                    | object containing the parameters                                                                           |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                           |                                    | id of the part to create extrusion feature in                                                              |
| [param.name]       | <code>string</code>                                                                                                                   | <code>&quot;Extrusion&quot;</code> | name of the extrusion feature (default="Extrusion")                                                        |
| param.references   | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                          |                                    | array of ids of the sketch contour elements, sketch regions or composite curves                            |
| [param.type]       | <code>&quot;UP&quot;</code> \| <code>&quot;DOWN&quot;</code> \| <code>&quot;SYMMETRIC&quot;</code> \| <code>&quot;CUSTOM&quot;</code> | <code>&quot;UP&quot;</code>        | type of the extrusion (default="UP")                                                                       |
| [param.limit1]     | <code>real</code> \| [<code>expression</code>](#expression)                                                                           | <code>0</code>                     | start of the extrusion (default=0), only used if type = "CUSTOM"                                           |
| [param.limit2]     | <code>real</code> \| [<code>expression</code>](#expression)                                                                           | <code>100</code>                   | end of the extrusion (default=100)                                                                         |
| [param.taperAngle] | <code>real</code> \| [<code>expression</code>](#expression)                                                                           | <code>0</code>                     | tapers the extrusion along direction with given angle in radians (default=0)                               |
| [param.direction]  | <code>point</code> \| [<code>expression</code>](#expression)                                                                          | <code>[0,0,1]</code>               | directon of the extrusion (default=[0,0,1]), only used if type = "CUSTOM"                                  |
| [param.capEnds]    | [<code>boolean</code>](#boolean)                                                                                                      | <code>TRUE</code>                  | if true, extrusion ends will be capped and a solid is created, else a sheet will be created (default=TRUE) |

**Example**

```js
api.v1.part.extrusion({ id: part, references: [sketchLine1, sketchLine2, sketchLine3], limit2: 150 })
```

<a name="fillet"></a>

## fillet(param)

Creates a fillet feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the fillet feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param            | Type                                                        | Default                         | Description                                   |
| ---------------- | ----------------------------------------------------------- | ------------------------------- | --------------------------------------------- |
| param            | <code>object</code>                                         |                                 | object containing the parameters              |
| param.id         | <code>string</code> \| <code>real</code> \| <code>id</code> |                                 | id of the part to create fillet feature in    |
| [param.name]     | <code>string</code>                                         | <code>&quot;Fillet&quot;</code> | name of the fillet feature (default="Fillet") |
| param.references | <code>Array&lt;(string\|real\|id)&gt;</code>                |                                 | selected brep edges to create fillet on       |
| [param.radius]   | <code>real</code> \| [<code>expression</code>](#expression) | <code>2</code>                  | radius of the fillet (default=2)              |

**Example**

```js
api.v1.part.fillet({ id: part, name: 'FilletTop', references: [edge1, edge2, edge3] })
api.v1.part.fillet({ id: part, name: 'FilletTop', references: [edge1, edge2, edge3], radius: '5/2' })
```

<a name="getBrepGeometryByIndex"></a>

## getBrepGeometryByIndex(param)

Returns a brep element within the given brep container by its index.
Points, lines, arcs, NURBS curves and faces are indexed separately, and there should be exactly one brep geometry indexing parameter specified (i.e., pointIndex / lineIndex / ...).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID // Brep geometry id
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                   | Type                                                        | Default        | Description                                                                     |
| ----------------------- | ----------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------- |
| param                   | <code>object</code>                                         |                | object containing the parameters                                                |
| param.id                | <code>string</code> \| <code>real</code> \| <code>id</code> |                | id of a solid or a feature containing a solid                                   |
| [param.solidIndex]      | <code>string</code> \| <code>real</code>                    | <code>0</code> | index of a solid within a feature in case more than one solid is appended to it |
| [param.pointIndex]      | <code>string</code> \| <code>real</code>                    |                | index of a vertex within the brep container                                     |
| [param.lineIndex]       | <code>string</code> \| <code>real</code>                    |                | index of a line within the brep container                                       |
| [param.arcIndex]        | <code>string</code> \| <code>real</code>                    |                | index of an arc within the brep container                                       |
| [param.nurbsCurveIndex] | <code>string</code> \| <code>real</code>                    |                | index of a NURBS curve within the brep container                                |
| [param.faceIndex]       | <code>string</code> \| <code>real</code>                    |                | index of a face within the brep container                                       |

**Example**

```js
api.v1.part.getBrepGeometryByIndex({ id: feature, lineIndex: 6 })
```

<a name="getBrepGeometryIndex"></a>

## getBrepGeometryIndex(param)

Returns an index of a brep element within its brep container.
Points, lines, arcs, NURBS curves and faces are indexed separately.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: real // Brep geometry index
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                        | Default        | Description                                                                     |
| ------------------ | ----------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------- |
| param              | <code>object</code>                                         |                | object containing the parameters                                                |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code> |                | id of a solid or a feature containing a solid                                   |
| [param.solidIndex] | <code>string</code> \| <code>real</code>                    | <code>0</code> | index of a solid within a feature in case more than one solid is appended to it |
| param.geomId       | <code>string</code> \| <code>real</code> \| <code>id</code> |                | brep element to be indexed                                                      |

**Example**

```js
api.v1.part.getBrepGeometryIndex({ id: feature, geomId: edge1 })
```

<a name="getExpression"></a>

## getExpression(param)

Returns the value and the expression

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    value: real|VOID,
    expression: string
  }|VOID,  // object containing expression information
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                               |
| ---------- | ----------------------------------------------------------- | ----------------------------------------- |
| param      | <code>object</code>                                         | object containing the parameters          |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the part to get the expression from |
| param.name | <code>string</code>                                         | name of the expression                    |

**Example**

```js
api.v1.part.getExpression({ id: part, name: 'height' })
```

<a name="getFeature"></a>

## getFeature(param)

Returns the id of the feature with the given name from the given part.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the found feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                            |
| ---------- | ----------------------------------------------------------- | -------------------------------------- |
| param      | <code>object</code>                                         | object containing all the parameters   |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the part to get the feature from |
| param.name | <code>string</code>                                         | the name of the feature to look for    |

**Example**

```js
api.v1.part.getFeature({ id: part, name: 'Chamfer' })
```

<a name="getGeometryIds"></a>

## getGeometryIds(param)

Returns the geometry (brep element like line, arc, plane,...) which best fits the given points

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: { points: id[], lines: id[], arcs: id[], circles: id[], nurbsCurves: id[], planes: id[], cylinders: id[],
    cones: id[], spheres: id[], nurbsSurfaces: id[] }  // object containing found geometries in the order of input
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                           | Type                                                        | Description                                                                           |
| ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| param                           | <code>object</code>                                         | object containing the parameters                                                      |
| param.id                        | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the part to look for the brep element                                           |
| [param.points]                  | <code>Array&lt;object&gt;</code>                            | array of objects containing the position to look for a point/vertex                   |
| param.points[].pos              | <code>point</code>                                          | exact position of the point/vertex                                                    |
| [param.lines]                   | <code>Array&lt;object&gt;</code>                            | array of objects containing the position to look for a line/edge                      |
| param.lines[].pos               | <code>point</code>                                          | position on the line/edge                                                             |
| [param.arcs]                    | <code>Array&lt;object&gt;</code>                            | array of objects containing the position to look for a arc/edge                       |
| param.arcs[].pos                | <code>point</code>                                          | position on the arc/edge                                                              |
| [param.circles]                 | <code>Array&lt;object&gt;</code>                            | array of objects containing the position to look for a circle/edge                    |
| param.circles[].pos             | <code>point</code>                                          | position on the circle/edge or on the plane the circle is surrounding                 |
| [param.nurbsCurves]             | <code>Array&lt;object&gt;</code>                            | array of objects containing the position to look for a nurbsCurve/edge                |
| param.nurbsCurves[].pos         | <code>point</code>                                          | position on the nurbsCurve/edge                                                       |
| [param.planes]                  | <code>Array&lt;object&gt;</code>                            | array of objects containing the positions to look for a plane/face                    |
| param.planes[].positions        | <code>Array&lt;point&gt;</code>                             | position on the plane or multiple positions of midpoints of adjacent edges            |
| [param.cylinders]               | <code>Array&lt;object&gt;</code>                            | array of objects containing the positions to look for a cylindrical face              |
| param.cylinders[].positions     | <code>Array&lt;point&gt;</code>                             | position on the cylindrical face or multiple positions of midpoints of adjacent edges |
| [param.cones]                   | <code>Array&lt;object&gt;</code>                            | array of objects containing the positions to look for a conical face                  |
| param.cones[].positions         | <code>Array&lt;point&gt;</code>                             | position on the conical face or multiple positions of midpoints of adjacent edges     |
| [param.spheres]                 | <code>Array&lt;object&gt;</code>                            | array of objects containing the positions to look for a spherical face                |
| param.spheres[].positions       | <code>Array&lt;point&gt;</code>                             | position on the spherical face or multiple positions of midpoints of adjacent edges   |
| [param.nurbsSurfaces]           | <code>Array&lt;object&gt;</code>                            | array of objects containing the positions to look for a nurbs face                    |
| param.nurbsSurfaces[].positions | <code>Array&lt;point&gt;</code>                             | position on the nurbs face or multiple positions of midpoints of adjacent edges       |

**Example**

```js
api.v1.part.getGeometryIds({
  id: part,
  planes: [
    {
      positions: [
        [0, 50, 100],
        [0, 100, 100],
      ],
    },
  ],
})
```

<a name="getGeometryPositions"></a>

## getGeometryPositions(param)

Returns the positions which uniquely identifying the geometries (brep element like line, arc, plane,...)

- for faces (plane, cylindrical, spherical): it returns the midpoints of the adjacent edges of the face
- for edges, arcs, circles: it returns the midpoint
- for vertices: it returns the point of vertex

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: Array<{ id: id, positions: point[] }>  // array of objects containing the positions which have been found for given id
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param       | Type                                         | Description                                 |
| ----------- | -------------------------------------------- | ------------------------------------------- |
| param       | <code>object</code>                          | object containing the parameters            |
| param.elems | <code>Array&lt;(string\|real\|id)&gt;</code> | brep elements to get indicating points from |

**Example**

```js
api.v1.part.getGeometryPositions({ elems: [15, 89] })
```

<a name="getSketch"></a>

## getSketch(param)

Returns the id of the sketch with the given name from the given part.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the found sketch
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                           |
| ---------- | ----------------------------------------------------------- | ------------------------------------- |
| param      | <code>object</code>                                         | object containing all the parameters  |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the part to get the sketch from |
| param.name | <code>string</code>                                         | the name of the sketch to look for    |

**Example**

```js
api.v1.part.getSketch({ id: part, name: 'Sketch_Front' })
```

<a name="getSketchRegion"></a>

## getSketchRegion(param)

Returns the id of the sketch region with the given name from the given part or instance.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the found sketch region
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                              |
| ---------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| param      | <code>object</code>                                         | object containing all the parameters                     |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the part or instance to get the sketch region from |
| param.name | <code>string</code>                                         | the name of the object to look for                       |

**Example**

```js
api.v1.part.getSketchRegion({ id: part, name: 'SketchRegion_Left' })
```

<a name="getWorkGeometry"></a>

## getWorkGeometry(param)

Returns the id of the work geometry object with the given name from the given part or instance.
Work geometry can be a workpoint, -axis, -plane or -coordinate system.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the found work geometry
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                         |
| ---------- | ----------------------------------------------------------- | --------------------------------------------------- |
| param      | <code>object</code>                                         | object containing all the parameters                |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the part or instance to get the geometry from |
| param.name | <code>string</code>                                         | the name of the work geometry to look for           |

**Example**

```js
api.v1.part.getWorkGeometry({ id: part, name: 'WorkCSys_Top' })
```

<a name="importFeature"></a>

## importFeature(param)

Creates an import feature. This allows to import other data like STP into the part.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the import feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                        | Default                         | Description                                                                                    |
| ------------------- | ----------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                         |                                 | object containing the parameters                                                               |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code> |                                 | id of the part to create import feature in                                                     |
| [param.name]        | <code>string</code>                                         | <code>&quot;Import&quot;</code> | name of the import feature (default="Import")                                                  |
| [param.url]         | <code>string</code>                                         |                                 | url to import model from                                                                       |
| [param.file]        | <code>string</code>                                         |                                 | full path of the file. Path has to be a for the ClassCAD process reachable local or UNC path.  |
| [param.data]        | <code>string</code>                                         |                                 | data/content of the model to import                                                            |
| [param.encoding]    | <code>&quot;base64&quot;</code>                             |                                 | the encoding the data is encoded with. If compression is also set, the decoding happens first! |
| [param.compression] | <code>&quot;deflate&quot;</code>                            |                                 | the compression algorithm the data is compressed with.                                         |
| [param.format]      | <code>&quot;STP&quot;</code>                                | <code>&quot;STP&quot;</code>    | content format of imported model (default="STP")                                               |

**Example**

```js
api.v1.part.importFeature({ id: part, url: 'https://.../Filename.stp', format: 'STP', name: 'Import' })
api.v1.part.importFeature({ id: part, data: 'xx124b', format: 'STP', name: 'Import' })
api.v1.part.importFeature({ id: part, file: '/var/models/file.stp', name: 'Import' })
```

<a name="linearPattern"></a>

## linearPattern(param)

Creates a linear pattern feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the linear pattern feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Default                                | Description                                                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code>                                                              |                                        | object containing the parameters                                                                                                                            |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                        | id of the part to create linear pattern feature in                                                                                                          |
| [param.name]              | <code>string</code>                                                              | <code>&quot;LinearPattern&quot;</code> | name of the linear pattern feature (default="LinearPattern")                                                                                                |
| param.targets             | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> |                                        | targets as ids of the features to use for this linear pattern feature or as objects containing an id and optional indices                                   |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                        | id of the feature, to use for this linear pattern                                                                                                           |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   |                                        | if more than one solid is appended to the feature, the indices can be used to select the solids                                                             |
| param.dir1                | <code>object</code>                                                              |                                        | object containing the parameters for the first direction of the linear pattern                                                                              |
| param.dir1.references     | <code>Array&lt;(string\|real\|id)&gt;</code>                                     |                                        | selected line (brep-edge, sketch-line or work-axis) or points (brep-vertex, sketch-point or work-point) defining the first direction of the linear pattern  |
| [param.dir1.inverted]     | [<code>boolean</code>](#boolean)                                                 | <code>FALSE</code>                     | if true, the first direction of the pattern will be inverted (default=FALSE)                                                                                |
| [param.dir1.distance]     | <code>real</code> \| [<code>expression</code>](#expression)                      | <code>0</code>                         | distance between entities along first direction of linear pattern (default=0)                                                                               |
| [param.dir1.count]        | <code>real</code> \| [<code>expression</code>](#expression)                      | <code>2</code>                         | number of entities along first direction of linear pattern (default=2)                                                                                      |
| [param.dir1.merged]       | [<code>boolean</code>](#boolean)                                                 | <code>FALSE</code>                     | if true, entities of the linear pattern will be merged to one entity (default=FALSE)                                                                        |
| [param.dir2]              | <code>object</code>                                                              |                                        | object containing the parameters for the second direction of the linear pattern                                                                             |
| param.dir2.references     | <code>Array&lt;(string\|real\|id)&gt;</code>                                     |                                        | selected line (brep-edge, sketch-line or work-axis) or points (brep-vertex, sketch-point or work-point) defining the second direction of the linear pattern |
| [param.dir2.inverted]     | [<code>boolean</code>](#boolean)                                                 | <code>FALSE</code>                     | if true, the second direction of the pattern will be inverted (default=FALSE)                                                                               |
| [param.dir2.distance]     | <code>real</code> \| [<code>expression</code>](#expression)                      | <code>0</code>                         | distance between entities along second direction of linear pattern (default=0)                                                                              |
| [param.dir2.count]        | <code>real</code> \| [<code>expression</code>](#expression)                      | <code>1</code>                         | number of entities along second direction of linear pattern (default=1)                                                                                     |

**Example**

```js
api.v1.part.linearPattern({ id: part, targets: [feature], dir1: { references: [workAxis], distance: 150, count: 4 } })
api.v1.part.linearPattern({ id: part, targets: [feature], dir1: { references: [workPoint1, workPoint2], distance: '150/3', merged: TRUE } })
```

<a name="linkWithExpression"></a>

## linkWithExpression(param)

Connects an expression with a dimensional constraint in a sketch or a parameter in a feature

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param          | Type                                                        | Description                                                    |
| -------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| param          | <code>object</code>                                         | object containing the parameters                               |
| param.id       | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the dimension or feature where to link an expression     |
| param.exprName | <code>string</code>                                         | name of the expression to link                                 |
| param.name     | <code>string</code>                                         | parameter in feature which will be connected to the expression |

**Example**

```js
api.v1.part.linkWithExpression({ id: dimension, exprName: 'length', name: 'limit2' })
```

<a name="mirror"></a>

## mirror(param)

Creates a mirror feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the mirror feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Default                         | Description                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code>                                                              |                                 | object containing the parameters                                                                                                                  |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                 | id of the part to create mirror feature in                                                                                                        |
| [param.name]              | <code>string</code>                                                              | <code>&quot;Mirror&quot;</code> | name of the mirror feature (default="Mirror")                                                                                                     |
| param.targets             | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> |                                 | targets as ids of the features to use for this mirror feature or as objects containing an id and optional indices                                 |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                 | id of the feature, to use for this mirror feature                                                                                                 |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   |                                 | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this mirror |
| param.references          | <code>Array&lt;(string\|real\|id)&gt;</code>                                     |                                 | selected planes or faces to mirror the solids at                                                                                                  |

**Example**

```js
api.v1.part.mirror({ id: part, targets: [feature1, feature2], references: [workPlane] })
api.v1.part.mirror({ id: part, targets: [{ id: pattern, indices: [2, 4] }, { id: feature1 }], references: [workPlane] })
```

<a name="openFeature"></a>

## openFeature(param)

Moves GhostRollbackBar to the position before passed feature, sets relevant entities' visibility.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param    | Type                                                        | Description                          |
| -------- | ----------------------------------------------------------- | ------------------------------------ |
| param    | <code>object</code>                                         | object containing all the parameters |
| param.id | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the feature to open            |

**Example**

```js
api.v1.part.openFeature({ id: feature })
```

<a name="operationMoveBefore"></a>

## operationMoveBefore(param)

Moves the rollback bar to the position right before the provided feature (backwards or forwards)
and sets the entities of the current feature visible. If changes on a feature have been made and the
rollback bar will be forwarded (to end direction), a recalculation of the features will be made.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param           | Type                                                        | Description                                       |
| --------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| param           | <code>object</code>                                         | object containing all the parameters              |
| param.id        | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the part to move the rollback bar           |
| param.featureId | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the feature to move the rollback bar before |

**Example**

```js
api.v1.part.operationMoveBefore({ id: part, featureId: feature })
```

<a name="operationMoveToEnd"></a>

## operationMoveToEnd(param)

Moves the rollback bar to the latest feature and sets the entities of the current feature visible.
If changes on a feature have been made, a recalculation of the features will be made.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param    | Type                                                        | Description                                        |
| -------- | ----------------------------------------------------------- | -------------------------------------------------- |
| param    | <code>object</code>                                         | object containing all the parameters               |
| param.id | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the part to move the rollback bar to the end |

**Example**

```js
api.v1.part.operationMoveToEnd({ id: part })
```

<a name="renameExpression"></a>

## renameExpression(param)

Renames expressions in different products

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: boolean  // true if everything is fine, false if renaming was not successful
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                  | Type                                                        | Description                                                                |
| ---------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| param                  | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters                                |
| param.id               | <code>string</code> \| <code>real</code> \| <code>id</code> | id or identifier of the product where the expressions wanted to be renamed |
| [param.toRename]       | <code>Array&lt;object&gt;</code>                            | array of expressions to be renamed                                         |
| param.toRename.name    | <code>string</code>                                         | name of the expression to be renamed                                       |
| param.toRename.newName | <code>string</code>                                         | new name of the expression to be renamed                                   |

**Example**

```js
api.v1.part.renameExpression({
  id: part,
  toRename: [
    { name: 'a', newName: 'b' },
    { name: 'h', newName: 'height' },
  ],
})
```

<a name="revolve"></a>

## revolve(param)

Creates or updates a revolve feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the revolve feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                        | Default                          | Description                                                                                                               |
| ------------------ | ----------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                         |                                  | object containing the parameters                                                                                          |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code> |                                  | id of the part to create revolve feature in                                                                               |
| [param.name]       | <code>string</code>                                         | <code>&quot;Revolve&quot;</code> | name of the revolve feature (default="Revolve")                                                                           |
| param.references   | <code>Array&lt;(string\|real\|id)&gt;</code>                |                                  | array of ids of the sketch contour elements, sketch regions or composite curves                                           |
| param.axisIds      | <code>Array&lt;(string\|real\|id)&gt;</code>                |                                  | array of ids, either a line (brep-edge, sketch-line or work-axis) or two points (brep-vertex, sketch-point or work-point) |
| [param.startAngle] | <code>real</code> \| [<code>expression</code>](#expression) | <code>0</code>                   | start angle of the revolve in radians (default=0)                                                                         |
| [param.endAngle]   | <code>real</code> \| [<code>expression</code>](#expression) | <code>2\*C:PI</code>             | end angle of the revolve in radians (default=2\*C:PI)                                                                     |
| [param.inverted]   | [<code>boolean</code>](#boolean)                            | <code>FALSE</code>               | if true, rotation direction around axis is cw, if false ccw (default=FALSE)                                               |

**Example**

```js
api.v1.part.revolve({ id: part, references: sketchLines, axisIds: [workAxis] })
api.v1.part.revolve({ id: part, references: sketchLines, axisIds: [workAxis], startAngle: '3.14/2', endAngle: 3.14 })
```

<a name="rotation"></a>

## rotation(param)

Creates a rotation feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the rotation feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Default                           | Description                                                                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code>                                                              |                                   | object containing the parameters                                                                                                                    |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                   | id of the part to create rotation feature in                                                                                                        |
| [param.name]              | <code>string</code>                                                              | <code>&quot;Rotation&quot;</code> | name of the rotation feature (default="Rotation")                                                                                                   |
| param.targets             | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> |                                   | targets as ids of the features to use for this rotation feature or as objects containing an id and optional indices                                 |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                   | id of the feature, to use for this rotation feature                                                                                                 |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   |                                   | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this rotation |
| param.references          | <code>Array&lt;(string\|real\|id)&gt;</code>                                     |                                   | array of ids, either a line (brep-edge, sketch-line or work-axis) or two points (brep-vertex, sketch-point or work-point) expected                  |
| [param.angle]             | <code>real</code> \| [<code>expression</code>](#expression)                      | <code>0</code>                    | angle of the rotation in radians (default=0)                                                                                                        |
| [param.inverted]          | [<code>boolean</code>](#boolean)                                                 | <code>FALSE</code>                | if false, the direction of rotation will be inverted (default=FALSE)                                                                                |

**Example**

```js
api.v1.part.rotation({ id: part, targets: [{ id: feature }], references: [15], angle: 3.14 })
```

<a name="setAppearance"></a>

## setAppearance(param)

Sets the appearance on the target, which is here defined by an id which is the feature
and optional inidices to select specific solids from the feature, if more than one solid
is appended.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                  | Type                                                                               | Description                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| param                  | <code>object</code> \| <code>Array&lt;object&gt;</code>                            | object or objects containing the parameters                                                         |
| param.target           | <code>string</code> \| <code>real</code> \| <code>id</code> \| <code>object</code> | target as id of the feature to set appearance or as object containing an id and optional indices    |
| param.target.id        | <code>string</code> \| <code>real</code> \| <code>id</code>                        | id of the feature, to set the appearance on                                                         |
| [param.target.indices] | <code>Array&lt;real&gt;</code>                                                     | if more than one solid is appended to the feature, the indices can be used to select the solids     |
| [param.color]          | <code>Array&lt;real&gt;</code>                                                     | array of three elements (rgb color), color[0] = r, color[1] = g, color[2] = b in the range of 0-255 |
| [param.transparency]   | <code>real</code>                                                                  | value of transparency between 0 and 1                                                               |
| [param.chordHeightTol] | <code>real</code>                                                                  | chord height tolerance                                                                              |
| [param.angleTol]       | <code>real</code>                                                                  | angle tolerance                                                                                     |

**Example**

```js
api.v1.part.setAppearance({ target: feature, color: [10, 125, 250], transparency: 0.5 })
api.v1.part.setAppearance({ target: { id: pattern, indices: [3, 5] }, chordHeightTol: 0.5, angleTol: 20 })
api.v1.part.setAppearance([
  { target: feature1, color: [10, 125, 250] },
  { target: feature2, transparency: 0.5 },
])
```

<a name="sketch"></a>

## sketch(param)

Creates a new sketch and places it optionally on a face or work plane

- if planeId is a face, a new work plane on that face will be created
- if planeId is a workplane, the sketch will directly placed on it

**Kind**: v1.part function  
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
api.v1.part.sketch({ id: part })
api.v1.part.sketch({ id: part, planeId: workPlane })
api.v1.part.sketch({ id: part, name: 'Sketch4' })
```

<a name="slice"></a>

## slice(param)

Creates a slice feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the slice feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Default                        | Description                                                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| param                     | <code>object</code>                                                              |                                | object containing the parameters                                                                                                                 |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                | id of the part to create slice feature in                                                                                                        |
| [param.name]              | <code>string</code>                                                              | <code>&quot;Slice&quot;</code> | name of the slice feature (default="Slice")                                                                                                      |
| param.targets             | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> |                                | targets as ids of the features to use for this slice feature or as objects containing an id and optional indices                                 |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                | id of the feature, to use for this slice feature                                                                                                 |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   |                                | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this slice |
| [param.reference]         | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                | selected work plane to slice the solids at                                                                                                       |
| [param.inverted]          | [<code>boolean</code>](#boolean)                                                 | <code>FALSE</code>             | if false, the solid which is on the side along normal vector of the work plane will be kept (default=FALSE)                                      |

**Example**

```js
api.v1.part.slice({ id: part, targets: [{ id: feature }], reference: 25 })
```

<a name="sliceBySheet"></a>

## sliceBySheet(param)

Creates a slice by sheet feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the slice by sheet feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                  | Type                                                                               | Default                               | Description                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                  | <code>object</code>                                                                |                                       | object containing the parameters                                                                                                                          |
| param.id               | <code>string</code> \| <code>real</code> \| <code>id</code>                        |                                       | id of the part to create slice by sheet feature in                                                                                                        |
| [param.name]           | <code>string</code>                                                                | <code>&quot;SliceBySheet&quot;</code> | name of the slice by sheet feature (default="SliceBySheet")                                                                                               |
| param.target           | <code>string</code> \| <code>real</code> \| <code>id</code> \| <code>object</code> |                                       | target as id of the feature to use for this slice by sheet feature or as object containing an id and optional indices                                     |
| param.target.id        | <code>string</code> \| <code>real</code> \| <code>id</code>                        |                                       | id of the feature, to use for this slice by sheet feature                                                                                                 |
| [param.target.indices] | <code>Array&lt;real&gt;</code>                                                     |                                       | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this slice by sheet |
| param.tool             | <code>string</code> \| <code>real</code> \| <code>id</code> \| <code>object</code> |                                       | tool as id of the feature to use for this slice by sheet feature or as object containing an id and optional indices                                       |
| param.tool.id          | <code>string</code> \| <code>real</code> \| <code>id</code>                        |                                       | id of the feature containing a sheet, to use for this slice by sheet feature                                                                              |
| [param.tool.indices]   | <code>Array&lt;real&gt;</code>                                                     |                                       | if more than one solid is appended to the tool feature, the indices can be used to specifiy which solids of the feature be used for this slice by sheet   |
| [param.inverted]       | [<code>boolean</code>](#boolean)                                                   | <code>FALSE</code>                    | if false, the solid which is on the side along normal vector of the work plane will be kept (default=FALSE)                                               |

**Example**

```js
api.v1.part.sliceBySheet({ id: part, target: feature1, tool: feature2 })
```

<a name="sphere"></a>

## sphere(param)

Creates a sphere feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the sphere feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                        | Default                         | Description                                                                                          |
| ------------------ | ----------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                         |                                 | object containing the parameters                                                                     |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code> |                                 | id of the part to create sphere feature in                                                           |
| [param.name]       | <code>string</code>                                         | <code>&quot;Sphere&quot;</code> | name of the sphere feature (default="Sphere")                                                        |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                |                                 | reference of the work coordinate system. If void or empty array, sphere is placed at drawing origin. |
| [param.radius]     | <code>real</code> \| [<code>expression</code>](#expression) | <code>100</code>                | radius of the sphere (default=100)                                                                   |

**Example**

```js
api.v1.part.sphere({ id: part, name: 'SphereCenter', references: [52] })
```

<a name="transformationByCSys"></a>

## transformationByCSys(param)

Creates a transformation by csys feature. The transformation is the matrix between first and second work coordinate system.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the transformation by csys feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Default                                       | Description                                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code>                                                              |                                               | object containing the parameters                                                                                                                                  |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                               | id of the part to create transformation by csys feature in                                                                                                        |
| [param.name]              | <code>string</code>                                                              | <code>&quot;TransformationByCSys&quot;</code> | name of the transformation by csys feature (default="TransformationByCSys")                                                                                       |
| param.targets             | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> |                                               | targets as ids of the features to use for this transformation by csys feature or as objects containing an id and optional indices                                 |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                               | id of the feature, to use for this transformation by csys feature                                                                                                 |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   |                                               | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this transformation by csys |
| param.references          | <code>Array&lt;(string\|real\|id)&gt;</code>                                     |                                               | two work coordinate systems are needed, whereas at index 0 the wcs "to" and at index 1 the wcs "from" is expected                                                 |

**Example**

```js
api.v1.part.transformationByCSys({ id: part, targets: [{ id: feature }], references: [wcs1, wcs2] })
```

<a name="translation"></a>

## translation(param)

Creates a translation feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the translation feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Default                              | Description                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| param                     | <code>object</code>                                                              |                                      | object containing the parameters                                                                                                                       |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                      | id of the part to create translation feature in                                                                                                        |
| [param.name]              | <code>string</code>                                                              | <code>&quot;Translation&quot;</code> | name of the translation feature (default="Translation")                                                                                                |
| param.targets             | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> |                                      | targets as ids of the features to use for this translation feature or as objects containing an id and optional indices                                 |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      |                                      | id of the feature, to use for this translation feature                                                                                                 |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   |                                      | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this translation |
| param.references          | <code>Array&lt;(string\|real\|id)&gt;</code>                                     |                                      | array of ids, either a line (brep-edge, sketch-line or work-axis) or two points (brep-vertex, sketch-point or work-point) expected                     |
| [param.distance]          | <code>real</code> \| [<code>expression</code>](#expression)                      | <code>0</code>                       | distance of the translation (default=0)                                                                                                                |
| [param.inverted]          | [<code>boolean</code>](#boolean)                                                 | <code>FALSE</code>                   | if false, the direction of translation will be inverted (default=FALSE)                                                                                |

**Example**

```js
api.v1.part.translation({ id: part, targets: [{ id: feature }], references: [workAxis], distance: 50 })
```

<a name="twist"></a>

## twist(param)

Creates a twist feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the twist feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                                                                                                  | Default                        | Description                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| param               | <code>object</code>                                                                                                                   |                                | object containing the parameters                                                                                                                                                                             |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                           |                                | id of the part to create twist feature in                                                                                                                                                                    |
| [param.name]        | <code>string</code>                                                                                                                   | <code>&quot;Twist&quot;</code> | name of the twist feature (default="Twist")                                                                                                                                                                  |
| param.references    | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                          |                                | array of ids of the sketch contour elements, sketch regions or composite curves                                                                                                                              |
| [param.type]        | <code>&quot;UP&quot;</code> \| <code>&quot;DOWN&quot;</code> \| <code>&quot;SYMMETRIC&quot;</code> \| <code>&quot;CUSTOM&quot;</code> | <code>&quot;UP&quot;</code>    | type of the twist (default="UP")                                                                                                                                                                             |
| [param.limit1]      | <code>real</code> \| [<code>expression</code>](#expression)                                                                           | <code>0</code>                 | start of the twist (default=0), only used if type = "CUSTOM"                                                                                                                                                 |
| [param.limit2]      | <code>real</code> \| [<code>expression</code>](#expression)                                                                           | <code>100</code>               | end of the twist (default=100)                                                                                                                                                                               |
| [param.twistAngle]  | <code>real</code> \| [<code>expression</code>](#expression)                                                                           | <code>0</code>                 | tapers the twist along direction with given angle in radians (default=0)                                                                                                                                     |
| [param.twistCenter] | <code>point</code> \| [<code>expression</code>](#expression)                                                                          | <code>[0,0,0]</code>           | point which together with direction defines the twist axis. The actual center/start of the twist is where the defined twist axis intersects the sketch plane (default=[0,0,0]), only used if type = "CUSTOM" |
| [param.direction]   | <code>point</code> \| [<code>expression</code>](#expression)                                                                          | <code>[0,0,1]</code>           | directon of the twist (default=[0,0,1]), only used if type = "CUSTOM"                                                                                                                                        |
| [param.capEnds]     | [<code>boolean</code>](#boolean)                                                                                                      | <code>TRUE</code>              | if true, twist ends will be capped and a solid is created, else a sheet will be created (default=TRUE)                                                                                                       |

**Example**

```js
api.v1.part.twist({ id: part, references: sketchLines, twistAngle: 3.14, limit2: 200, direction: [0, 1, 1], type: 'UP' })
api.v1.part.twist({ id: part, references: sketchLines, twistAngle: 3.14, limit2: '2*50' })
api.v1.part.twist({ id: part, references: sketchLines, twistAngle: '2*3.14' })
api.v1.part.twist({ id: part, references: sketchLines, twistAngle: '2*0.785', limit1: '25+15', limit2: 150, type: 'CUSTOM' })
```

<a name="unlinkExpression"></a>

## unlinkExpression(param)

Unlinks expression from dimensional constraints in sketcher or parameter in feature

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                                      |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| param      | <code>object</code>                                         | object containing the parameters                                 |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the dimension or feature where to unlink an expression     |
| param.name | <code>string</code>                                         | name of the parameter which will be disconnected from expression |

**Example**

```js
api.v1.part.unlinkExpression({ id: feature, name: 'height' })
```

<a name="updateBoolean"></a>

## updateBoolean(param)

Updates a boolean feature.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the boolean feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                   | Type                                                                                                            | Description                                                                                                                                                                                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                   | <code>object</code>                                                                                             | object containing the parameters                                                                                                                                                                                                                                                         |
| param.id                | <code>string</code> \| <code>real</code> \| <code>id</code>                                                     | id of the boolean feature to update                                                                                                                                                                                                                                                      |
| [param.name]            | <code>string</code>                                                                                             | name of the boolean feature depends on the type                                                                                                                                                                                                                                          |
| [param.type]            | <code>&quot;UNION&quot;</code> \| <code>&quot;SUBTRACTION&quot;</code> \| <code>&quot;INTERSECTION&quot;</code> | type of the boolean operation - "UNION": all the solids will be unified to one solid - "SUBTRACTION": all the solids will be subtracted from the first one in the array - "INTERSECTION": all the solids will be intersected with the first or the result solid of previous intersection |
| [param.target]          | <code>object</code>                                                                                             | target containing an id and optional indices                                                                                                                                                                                                                                             |
| param.target.id         | <code>string</code> \| <code>real</code> \| <code>id</code>                                                     | id of the feature, to use as base feature for this boolean operation                                                                                                                                                                                                                     |
| [param.target.indices]  | <code>Array&lt;real&gt;</code>                                                                                  | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this boolean                                                                                                                                       |
| [param.tools]           | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code>                                | tools as ids of the features to use for this boolean feature or as objects containing an id and optional indices                                                                                                                                                                         |
| param.tools[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                                                     | id of the feature, to use as tool feature for this boolean operation                                                                                                                                                                                                                     |
| [param.tools[].indices] | <code>Array&lt;real&gt;</code>                                                                                  | if more than one solid is appended to the tool feature, the indices can be used to specifiy which solids of the feature be used for this boolean                                                                                                                                         |

**Example**

```js
api.v1.part.updateBoolean({ id: feature, type: 'INTERSECTION', name: 'intersection' })
```

<a name="updateBox"></a>

## updateBox(param)

Updates a box feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the box feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                        | Description                                                                                       |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                         | object containing the parameters                                                                  |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the box feature to update                                                                   |
| [param.name]       | <code>string</code>                                         | name of the box feature                                                                           |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                | reference of the work coordinate system. If void or empty array, box is placed at drawing origin. |
| [param.length]     | <code>real</code> \| [<code>expression</code>](#expression) | length of the box in x-direction                                                                  |
| [param.width]      | <code>real</code> \| [<code>expression</code>](#expression) | width of the box in y-direction                                                                   |
| [param.height]     | <code>real</code> \| [<code>expression</code>](#expression) | height of the box in z-direction                                                                  |

**Example**

```js
api.v1.part.updateBox({ id: feature, name: 'BoxTop' })
api.v1.part.updateBox({ id: feature, references: [wcs], height: '3*65' })
```

<a name="updateChamfer"></a>

## updateChamfer(param)

Updates a chamfer feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the chamfer feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                                                                                         | Description                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| param              | <code>object</code>                                                                                                          | object containing the parameters                    |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                  | id of the chamfer feature to update                 |
| [param.name]       | <code>string</code>                                                                                                          | name of the chamfer feature                         |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                 | selected brep edges to create chamfer on            |
| [param.type]       | <code>&quot;EQUAL_DISTANCE&quot;</code> \| <code>&quot;TWO_DISTANCES&quot;</code> \| <code>&quot;DISTANCE_ANGLE&quot;</code> | type of the chamfer                                 |
| [param.distance1]  | <code>real</code> \| [<code>expression</code>](#expression)                                                                  | distance1 of the chamfer for all types              |
| [param.distance2]  | <code>real</code> \| [<code>expression</code>](#expression)                                                                  | distance2 of the chamfer for type = "TWO_DISTANCES" |
| [param.angle]      | <code>real</code> \| [<code>expression</code>](#expression)                                                                  | angle of the chamfer for type = "DISTANCE_ANGLE"    |

**Example**

```js
api.v1.part.updateChamfer({ id: feature, name: 'Chamfer' })
api.v1.part.updateChamfer({ id: feature, type: 'DISTANCE_ANGLE', distance1: 10, angle: '3.14/6' })
```

<a name="updateCircularPattern"></a>

## updateCircularPattern(param)

Updates a circular pattern feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the circular pattern feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Description                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code>                                                              | object containing the parameters                                                                                                                  |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the circular pattern feature to update                                                                                                      |
| [param.name]              | <code>string</code>                                                              | name of the mirror feature                                                                                                                        |
| [param.targets]           | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> | targets as ids of the features to use for this circular pattern feature or as objects containing an id and optional indices                       |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the feature, to use for this circular pattern                                                                                               |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   | if more than one solid is appended to the feature, the indices can be used to select the solids                                                   |
| [param.references]        | <code>Array&lt;(string\|real\|id)&gt;</code>                                     | selected line (brep-edge, sketch-line or work-axis) or points (brep-vertex, sketch-point or work-point) defining the axis of the circular pattern |
| [param.inverted]          | [<code>boolean</code>](#boolean)                                                 | if true, the rotation around axis of the pattern will be inverted (default=FALSE)                                                                 |
| [param.angle]             | <code>real</code> \| [<code>expression</code>](#expression)                      | angle between entities around axis of circular pattern                                                                                            |
| [param.count]             | <code>real</code> \| [<code>expression</code>](#expression)                      | number of entities around axis of circular pattern                                                                                                |
| [param.merged]            | [<code>boolean</code>](#boolean)                                                 | if true, entities of the circular pattern will be merged to one entity                                                                            |

**Example**

```js
api.v1.part.updateCircularPattern({ id: feature, angle: 0.785, count: 8, merged: FALSE })
```

<a name="updateCompositeCurve"></a>

## updateCompositeCurve(param)

Updates a composite curve feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the composite curve feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                        | Description                                       |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------- |
| param              | <code>object</code>                                         | object containing the parameters                  |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the composite curve feature to update       |
| [param.name]       | <code>string</code>                                         | name of the composite curve feature               |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                | selected curves to build the composite curve from |

**Example**

```js
api.v1.part.updateCompositeCurve({ id: feature, references: [edge1, edge2, edge3, edge4] })
```

<a name="updateCone"></a>

## updateCone(param)

Updates a cone feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the cone feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                        | Description                                                                                        |
| ------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                         | object containing the parameters                                                                   |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the cone feature to update                                                                   |
| [param.name]       | <code>string</code>                                         | name of the cone feature                                                                           |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                | reference of the work coordinate system. If void or empty array, cone is placed at drawing origin. |
| [param.bDiameter]  | <code>real</code> \| [<code>expression</code>](#expression) | diameter at the bottom of the cone                                                                 |
| [param.tDiameter]  | <code>real</code> \| [<code>expression</code>](#expression) | diameter at the top of the cone                                                                    |
| [param.height]     | <code>real</code> \| [<code>expression</code>](#expression) | height of the cone (z-direction)                                                                   |

**Example**

```js
api.v1.part.updateCone({ id: feature, tDiameter: 5 })
api.v1.part.updateCone({ id: feature, height: '3*diameter' })
```

<a name="updateCylinder"></a>

## updateCylinder(param)

Updates a cylinder feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the cone feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                        | Description                                                                                            |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| param              | <code>object</code>                                         | object containing the parameters                                                                       |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the cylinder feature to update                                                                   |
| [param.name]       | <code>string</code>                                         | name of the cylinder feature                                                                           |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                | reference of the work coordinate system. If void or empty array, cylinder is placed at drawing origin. |
| [param.diameter]   | <code>real</code> \| [<code>expression</code>](#expression) | diameter of the cylinder                                                                               |
| [param.height]     | <code>real</code> \| [<code>expression</code>](#expression) | height of the cylinder in z-direction                                                                  |

**Example**

```js
api.v1.part.updateCylinder({ id: feature, name: 'Cyl', references: [wcs] })
api.v1.part.updateCylinder({ id: feature, references: [wcs], height: '2*diam' })
```

<a name="updateEntityDeletion"></a>

## updateEntityDeletion(param)

Updates an existing entity deletion feature.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the entitiy deletion feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Description                                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code>                                                              | object containing the parameters                                                                                                                           |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the entity deletion feature to update                                                                                                                |
| [param.name]              | <code>string</code>                                                              | name of the entity deletion feature                                                                                                                        |
| [param.targets]           | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> | targets as ids of the features to use for this entity deletion feature or as objects containing an id and optional indices                                 |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the feature, to use for this deletion feature                                                                                                        |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this entity deletion |

**Example**

```js
api.v1.part.updateEntityDeletion({ id: feature, targets: [{ id: pattern, indices: [0, 2, 4] }] })
```

<a name="updateExpression"></a>

## updateExpression(param)

Updates an existing expressions in different products

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: boolean  // true if everything is fine, if updating model caused an error false is returned
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                | Type                                                        | Description                                                                |
| -------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| param                | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters                                |
| param.id             | <code>string</code> \| <code>real</code> \| <code>id</code> | id or identifier of the product where the expressions wanted to be updated |
| [param.toUpdate]     | <code>Array&lt;object&gt;</code>                            | array of expressions to be updated                                         |
| param.toUpdate.name  | <code>string</code>                                         | name of the expression to update                                           |
| param.toUpdate.value | <code>real</code> \| <code>string</code>                    | value of to update expression                                              |

**Example**

```js
api.v1.part.updateExpression({ id: part, toUpdate: [{ name: 'lenght', value: 40 }] })
```

<a name="updateExtrusion"></a>

## updateExtrusion(param)

Updates an extrusion feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the extrusion feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                                                                                                  | Description                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                                                                                                   | object containing the parameters                                                            |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                           | id of the extrusion feature to update                                                       |
| [param.name]       | <code>string</code>                                                                                                                   | name of the extrusion feature                                                               |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                          | array of ids of the sketch contour elements, sketch regions or composite curves             |
| [param.type]       | <code>&quot;UP&quot;</code> \| <code>&quot;DOWN&quot;</code> \| <code>&quot;SYMMETRIC&quot;</code> \| <code>&quot;CUSTOM&quot;</code> | type of the extrusion                                                                       |
| [param.limit1]     | <code>real</code> \| [<code>expression</code>](#expression)                                                                           | start of the extrusion, only used if type = "CUSTOM"                                        |
| [param.limit2]     | <code>real</code> \| [<code>expression</code>](#expression)                                                                           | end of the extrusion                                                                        |
| [param.taperAngle] | <code>real</code> \| [<code>expression</code>](#expression)                                                                           | tapers the extrusion along direction with given angle in radians                            |
| [param.direction]  | <code>point</code> \| [<code>expression</code>](#expression)                                                                          | directon of the extrusion, only used if type = "CUSTOM"                                     |
| [param.capEnds]    | [<code>boolean</code>](#boolean)                                                                                                      | if true, extrusion ends will be capped and a solid is created, else a sheet will be created |

**Example**

```js
api.v1.part.updateExtrusion({ id: feature, references: [sketchLine1, sketchLine2, sketchLine3] })
```

<a name="updateFillet"></a>

## updateFillet(param)

Updates a fillet feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the fillet feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                        | Description                             |
| ------------------ | ----------------------------------------------------------- | --------------------------------------- |
| param              | <code>object</code>                                         | object containing the parameters        |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the fillet feature to update      |
| [param.name]       | <code>string</code>                                         | name of the fillet feature              |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                | selected brep edges to create fillet on |
| [param.radius]     | <code>real</code> \| [<code>expression</code>](#expression) | radius of the fillet                    |

**Example**

```js
api.v1.part.updateFillet({ id: feature, name: 'Fillet' })
api.v1.part.updateFillet({ id: feature, radius: '5/2' })
```

<a name="updateImportFeature"></a>

## updateImportFeature(param)

Updates an import feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the import feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                        | Description                                                                                    |
| ------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                         | object containing the parameters                                                               |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the import feature to update                                                             |
| [param.name]        | <code>string</code>                                         | name of the import feature                                                                     |
| [param.url]         | <code>string</code>                                         | url to import model from                                                                       |
| [param.file]        | <code>string</code>                                         | full path of the file. Path has to be a for the ClassCAD process reachable local or UNC path.  |
| [param.data]        | <code>string</code>                                         | data/content of the model to import                                                            |
| [param.encoding]    | <code>&quot;base64&quot;</code>                             | the encoding the data is encoded with. If compression is also set, the decoding happens first! |
| [param.compression] | <code>&quot;deflate&quot;</code>                            | the compression algorithm the data is compressed with.                                         |
| [param.format]      | <code>&quot;STP&quot;</code>                                | content format of imported model                                                               |

**Example**

```js
api.v1.part.updateImportFeature({ id: feature, name: 'ImportNew' })
api.v1.part.updateImportFeature({ id: feature, file: '/var/models/file.stp' })
api.v1.part.updateImportFeature({ id: feature, url: 'https://.../Filename.stp', format: 'STP' })
api.v1.part.updateImportFeature({ id: feature, data: 'xyx', format: 'STP', compression: 'deflate', encoding: 'base64' })
api.v1.part.updateImportFeature({ id: feature, data: 'xyx', format: 'STP', compression: 'deflate' })
api.v1.part.updateImportFeature({ id: feature, data: 'xyx', format: 'STP' })
```

<a name="updateLinearPattern"></a>

## updateLinearPattern(param)

Updates a linear pattern feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the linear pattern feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Description                                                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code>                                                              | object containing the parameters                                                                                                                            |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the linear pattern feature to update                                                                                                                  |
| [param.name]              | <code>string</code>                                                              | name of the liinear pattern feature                                                                                                                         |
| [param.targets]           | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> | targets as ids of the features to use for this linear pattern feature or as objects containing an id and optional indices                                   |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the feature, to use for this linear pattern                                                                                                           |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   | if more than one solid is appended to the feature, the indices can be used to select the solids                                                             |
| [param.dir1]              | <code>object</code>                                                              | object containing the parameters for the first direction of the linear pattern                                                                              |
| [param.dir1.references]   | <code>Array&lt;(string\|real\|id)&gt;</code>                                     | selected line (brep-edge, sketch-line or work-axis) or points (brep-vertex, sketch-point or work-point) defining the first direction of the linear pattern  |
| [param.dir1.inverted]     | [<code>boolean</code>](#boolean)                                                 | if true, the first direction of the pattern will be inverted                                                                                                |
| [param.dir1.distance]     | <code>real</code> \| [<code>expression</code>](#expression)                      | distance between entities along first direction of linear pattern                                                                                           |
| [param.dir1.count]        | <code>real</code> \| [<code>expression</code>](#expression)                      | number of entities along first direction of linear pattern                                                                                                  |
| [param.dir1.merged]       | [<code>boolean</code>](#boolean)                                                 | if true, entities of the linear pattern will be merged to one entity                                                                                        |
| [param.dir2]              | <code>object</code>                                                              | object containing the parameters for the second direction of the linear pattern                                                                             |
| [param.dir2.references]   | <code>Array&lt;(string\|real\|id)&gt;</code>                                     | selected line (brep-edge, sketch-line or work-axis) or points (brep-vertex, sketch-point or work-point) defining the second direction of the linear pattern |
| [param.dir2.inverted]     | [<code>boolean</code>](#boolean)                                                 | if true, the second direction of the pattern will be inverted                                                                                               |
| [param.dir2.distance]     | <code>real</code> \| [<code>expression</code>](#expression)                      | distance between entities along second direction of linear pattern                                                                                          |
| [param.dir2.count]        | <code>real</code> \| [<code>expression</code>](#expression)                      | number of entities along second direction of linear pattern                                                                                                 |

**Example**

```js
api.v1.part.updateLinearPattern({ id: feature, dir1: { references: [workAxis], distance: 150, count: 4 } })
api.v1.part.updateLinearPattern({ id: feature, dir1: { merged: FALSE } })
```

<a name="updateMirror"></a>

## updateMirror(param)

Updates a mirror feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the mirror feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Description                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code>                                                              | object containing the parameters                                                                                                                  |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the mirror feature to update                                                                                                                |
| [param.name]              | <code>string</code>                                                              | name of the mirror feature                                                                                                                        |
| [param.targets]           | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> | targets as ids of the features to use for this mirror feature or as objects containing an id and optional indices                                 |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the feature, to use for this mirror feature                                                                                                 |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this mirror |
| [param.references]        | <code>Array&lt;(string\|real\|id)&gt;</code>                                     | selected planes or faces to mirror the solids at                                                                                                  |

**Example**

```js
api.v1.part.updateMirror({ id: feature, references: [15] })
api.v1.part.updateMirror({ id: feature, targets: [{ id: feature1 }, { id: feature2 }] })
```

<a name="updateRevolve"></a>

## updateRevolve(param)

Updates a revolve feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the revolve feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                        | Description                                                                                                               |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                         | object containing the parameters                                                                                          |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the revolve feature to update                                                                                       |
| [param.name]       | <code>string</code>                                         | name of the revolve feature                                                                                               |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                | array of ids of the sketch contour elements, sketch regions or composite curves                                           |
| [param.axisIds]    | <code>Array&lt;(string\|real\|id)&gt;</code>                | array of ids, either a line (brep-edge, sketch-line or work-axis) or two points (brep-vertex, sketch-point or work-point) |
| [param.startAngle] | <code>real</code> \| [<code>expression</code>](#expression) | start angle of the revolve in radians                                                                                     |
| [param.endAngle]   | <code>real</code> \| [<code>expression</code>](#expression) | end angle of the revolve in radians                                                                                       |
| [param.inverted]   | [<code>boolean</code>](#boolean)                            | if true, rotation direction around axis is cw, if false ccw                                                               |

**Example**

```js
api.v1.part.updateRevolve({ id: feature, startAngle: 0.785 })
api.v1.part.updateRevolve({ id: feature, inverted: TRUE })
```

<a name="updateRotation"></a>

## updateRotation(param)

Updates a rotation feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the rotation feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Description                                                                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code>                                                              | object containing the parameters                                                                                                                    |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the rotation feature to update                                                                                                                |
| [param.name]              | <code>string</code>                                                              | name of the rotation feature                                                                                                                        |
| [param.targets]           | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> | targets as ids of the features to use for this rotation feature or as objects containing an id and optional indices                                 |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the feature, to use for this rotation feature                                                                                                 |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this rotation |
| [param.references]        | <code>Array&lt;(string\|real\|id)&gt;</code>                                     | array of ids, either a line (brep-edge, sketch-line or work-axis) or two points (brep-vertex, sketch-point or work-point) expected                  |
| [param.angle]             | <code>real</code> \| [<code>expression</code>](#expression)                      | angle of the rotation in radians                                                                                                                    |
| [param.inverted]          | [<code>boolean</code>](#boolean)                                                 | if false, the direction of rotation will be inverted                                                                                                |

**Example**

```js
api.v1.part.updateRotation({ id: feature1, targets: [{ id: feature2 }], references: [edge], angle: 3.14 })
```

<a name="updateSlice"></a>

## updateSlice(param)

Updates a slice feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the slice feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Description                                                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| param                     | <code>object</code>                                                              | object containing the parameters                                                                                                                 |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the slice feature to update                                                                                                                |
| [param.name]              | <code>string</code>                                                              | name of the slice feature                                                                                                                        |
| [param.targets]           | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> | targets as ids of the features to use for this slice feature or as objects containing an id and optional indices                                 |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the feature, to use for this slice feature                                                                                                 |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this slice |
| [param.reference]         | <code>string</code> \| <code>real</code> \| <code>id</code>                      | selected work plane to slice the solids at                                                                                                       |
| [param.inverted]          | [<code>boolean</code>](#boolean)                                                 | if false, the solid which is on the side along normal vector of the work plane will be kept                                                      |

**Example**

```js
api.v1.part.updateSlice({ id: feature, inverted: TRUE })
```

<a name="updateSliceBySheet"></a>

## updateSliceBySheet(param)

Updates a slice by sheet feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the slice by sheet feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                  | Type                                                        | Description                                                                                                                                               |
| ---------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                  | <code>object</code>                                         | object containing the parameters                                                                                                                          |
| param.id               | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the slice by sheet feature to update                                                                                                                |
| [param.name]           | <code>string</code>                                         | name of the slice by sheet feature                                                                                                                        |
| [param.target]         | <code>object</code>                                         | target containing an id and optional indices                                                                                                              |
| param.target.id        | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the feature, to use for this slice by sheet feature                                                                                                 |
| [param.target.indices] | <code>Array&lt;real&gt;</code>                              | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this slice by sheet |
| [param.tool]           | <code>object</code>                                         | tool containing an id and optional indices                                                                                                                |
| param.tool.id          | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the feature containing a sheet, to use for this slice by sheet feature                                                                              |
| [param.tool.indices]   | <code>Array&lt;real&gt;</code>                              | if more than one solid is appended to the tool feature, the indices can be used to specifiy which solids of the feature be used for this slice by sheet   |
| [param.inverted]       | [<code>boolean</code>](#boolean)                            | if false, the solid which is on the side along normal vector of the work plane will be kept                                                               |

**Example**

```js
api.v1.part.updateSliceBySheet({ id: feature, inverted: TRUE })
```

<a name="updateSphere"></a>

## updateSphere(param)

Updates a sphere feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the sphere feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                        | Description                                                                                          |
| ------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                         | object containing the parameters                                                                     |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the sphere feature to update                                                                   |
| [param.name]       | <code>string</code>                                         | name of the sphere feature                                                                           |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                | reference of the work coordinate system. If void or empty array, sphere is placed at drawing origin. |
| [param.radius]     | <code>real</code> \| [<code>expression</code>](#expression) | radius of the sphere                                                                                 |

**Example**

```js
api.v1.part.updateSphere({ id: feature, radius: 60 })
```

<a name="updateTransformationByCSys"></a>

## updateTransformationByCSys(param)

Updates a transformation by csys feature. The transformation is the matrix between first and second work coordinate system.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the transformation by csys feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Description                                                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| param                     | <code>object</code>                                                              | object containing the parameters                                                                                                                             |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the transformation by csys feature to update                                                                                                           |
| [param.name]              | <code>string</code>                                                              | name of the transformation by csys feature                                                                                                                   |
| [param.targets]           | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> | targets as ids of the features to use for this transformation by csys feature or as objects containing an id and optional indices                            |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the feature, to use for this transformation by csys feature                                                                                            |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this transform by csys |
| [param.references]        | <code>Array&lt;(string\|real\|id)&gt;</code>                                     | two work coordinate systems are needed, whereas at index 0 the wcs "to" and at index 1 the wcs "from" is expected                                            |

**Example**

```js
api.v1.part.updateTransformationByCSys({ id: feature1, targets: [{ id: feature2 }], references: [wcs1, wcs2] })
```

<a name="updateTranslation"></a>

## updateTranslation(param)

Updates a translation feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the translate feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                             | Description                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| param                     | <code>object</code>                                                              | object containing the parameters                                                                                                                       |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the translation feature to update                                                                                                                |
| [param.name]              | <code>string</code>                                                              | name of the translation feature                                                                                                                        |
| [param.targets]           | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> | targets as ids of the features to use for this translation feature or as objects containing an id and optional indices                                 |
| param.targets[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the feature, to use for this translation feature                                                                                                 |
| [param.targets[].indices] | <code>Array&lt;real&gt;</code>                                                   | if more than one solid is appended to the target feature, the indices can be used to specifiy which solids of the feature be used for this translation |
| [param.references]        | <code>Array&lt;(string\|real\|id)&gt;</code>                                     | array of ids, either a line (brep-edge, sketch-line or work-axis) or two points (brep-vertex, sketch-point or work-point) expected                     |
| [param.distance]          | <code>real</code> \| [<code>expression</code>](#expression)                      | distance of the translation                                                                                                                            |
| [param.inverted]          | [<code>boolean</code>](#boolean)                                                 | if false, the direction of translation will be inverted                                                                                                |

**Example**

```js
api.v1.part.updateTranslation({ id: feature, distance: 520 })
```

<a name="updateTwist"></a>

## updateTwist(param)

Updates a twist feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the twist feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                                                                                                  | Description                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| param               | <code>object</code>                                                                                                                   | object containing the parameters                                                                                                                                                           |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                           | id of the twist feature to update                                                                                                                                                          |
| [param.name]        | <code>string</code>                                                                                                                   | name of the twist feature                                                                                                                                                                  |
| [param.references]  | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                          | array of ids of the sketch contour elements, sketch regions or composite curves                                                                                                            |
| [param.type]        | <code>&quot;UP&quot;</code> \| <code>&quot;DOWN&quot;</code> \| <code>&quot;SYMMETRIC&quot;</code> \| <code>&quot;CUSTOM&quot;</code> | type of the twist                                                                                                                                                                          |
| [param.limit1]      | <code>real</code> \| [<code>expression</code>](#expression)                                                                           | start of the twist, only used if type = "CUSTOM"                                                                                                                                           |
| [param.limit2]      | <code>real</code> \| [<code>expression</code>](#expression)                                                                           | end of the twist                                                                                                                                                                           |
| [param.twistAngle]  | <code>real</code> \| [<code>expression</code>](#expression)                                                                           | tapers the twist along direction with given angle in radians                                                                                                                               |
| [param.twistCenter] | <code>point</code> \| [<code>expression</code>](#expression)                                                                          | point which together with direction defines the twist axis. The actual center/start of the twist is where the defined twist axis intersects the sketch plane, only used if type = "CUSTOM" |
| [param.direction]   | <code>point</code> \| [<code>expression</code>](#expression)                                                                          | directon of the twist, only used if type = "CUSTOM"                                                                                                                                        |
| [param.capEnds]     | [<code>boolean</code>](#boolean)                                                                                                      | if true, twist ends will be capped and a solid is created, else a sheet will be created                                                                                                    |

**Example**

```js
api.v1.part.updateTwist({ id: feature, twistAngle: 1.57, limit2: 200, direction: [0, 1, 1], type: 'UP' })
api.v1.part.updateTwist({ id: feature, twistAngle: 3.14, limit2: '2*50' })
api.v1.part.updateTwist({ id: feature, twistAngle: '2*3.14' })
api.v1.part.updateTwist({ id: feature, references: [111, 123, 125], twistAngle: '2*0.785', capEnds: FALSE })
```

<a name="updateWorkAxis"></a>

## updateWorkAxis(param)

Updates a work axis feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the work axis feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                                                                                                                                                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                                                                                                                                                       | object containing the parameters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                               | id of the work axis to update                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| [param.name]       | <code>string</code>                                                                                                                                                                       | name of the work axis feature                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| [param.type]       | <code>&quot;USERDEFINED&quot;</code> \| <code>&quot;POINTDIRECTION&quot;</code> \| <code>&quot;CURVE&quot;</code> \| <code>&quot;2POINTS&quot;</code> \| <code>&quot;2PLANES&quot;</code> | type of the work axis - "USERDEFINED": the work axis has no reference, it's defined by position and direction - "POINTDIRECTION": the work axis is referenced by a point (brep-vertex, sketch-point or work-point) and direction (brep-edge, sketch-line or work-axis) - "CURVE": the work axis is referenced by curve (brep-edge, sketch-line or work-axis) - "2POINTS": the work axis is referenced by two points (brep-vertex, sketch-point or work-point) - "2PLANES": the work axis is referenced by two planes (brep-face or work-plane) |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                              | selected edges, vertices, faces, not needed if type = "USERDEFINED"                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| [param.position]   | <code>point</code> \| [<code>expression</code>](#expression)                                                                                                                              | position of the work axis for type "USERDEFINED"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| [param.direction]  | <code>point</code> \| [<code>expression</code>](#expression)                                                                                                                              | normal vector of the work axis for type "USERDEFINED"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

**Example**

```js
api.v1.part.updateWorkAxis({ id: workAxis, position: [0, 150, 0], direction: [1, 1, 0] })
```

<a name="updateWorkCSys"></a>

## updateWorkCSys(param)

Updates a work coordinate system feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the work coordinate system feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                                     | Description                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                                      | object containing the parameters                                                                                                                                                                         |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code>              | id of the work coordinate system to update                                                                                                                                                               |
| [param.name]       | <code>string</code>                                                      | name of the work coordinate system feature                                                                                                                                                               |
| [param.type]       | <code>&quot;CUSTOM&quot;</code> \| <code>&quot;XYAXISORIGIN&quot;</code> | type of the work coordinate system - "CUSTOM": means that it's created in the origin with global directions (x, y) - "XYAXISORIGIN": means that the origin and the directions can be set with references |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                             | references of origin, first axis and second axis, not needed if type = "CUSTOM"                                                                                                                          |
| [param.offset]     | <code>point</code> \| [<code>expression</code>](#expression)             | offset as vector along axis                                                                                                                                                                              |
| [param.rotation]   | <code>point</code> \| [<code>expression</code>](#expression)             | rotation as vector around axis in radians                                                                                                                                                                |
| [param.inverted]   | [<code>boolean</code>](#boolean)                                         | if true, the work coordinate system will be inverted at x-axis                                                                                                                                           |

**Example**

```js
api.v1.part.updateWorkCSys({ id: wcs, offset: [100, 100, 0] })
api.v1.part.updateWorkCSys({ id: wcs, type: 'CUSTOM', rotation: [0, 0, 1.57] })
```

<a name="updateWorkPlane"></a>

## updateWorkPlane(param)

Updates a work plane feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the work plane feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                                                                                                                                                                                                                                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                                                                                                                                                                                                                                       | object containing the parameters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                                                                                                               | id of the work plane to update                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| [param.name]       | <code>string</code>                                                                                                                                                                                                                                                       | name of the work plane feature                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| [param.type]       | <code>&quot;USERDEFINED&quot;</code> \| <code>&quot;PLANE&quot;</code> \| <code>&quot;EDGEPOINT&quot;</code> \| <code>&quot;3POINTS&quot;</code> \| <code>&quot;POINTNORMAL&quot;</code> \| <code>&quot;POINTFACE&quot;</code> \| <code>&quot;LINEPLANEANGLE&quot;</code> | type of the work plane - "USERDEFINED": the work plane has no reference, it's defined by normal, position and offset - "PLANE": the work plane is referenced by a plane (brep-face or work-plane), an offset can be set - "EDGEPOINT": the work plane is referenced by an edge (brep-edge, sketch-line or work-axis) and point (brep-vertex, sketch-point or work-point), an offset can be set - "3POINTS": the work plane is referenced by three points (brep-vertex, sketch-point or work-point), an offset can be set - "POINTNORMAL": the work plane is referenced by a point (brep-vertex, sketch-point or work-point) and direction (brep-edge, sketch-line or work-axis), where the direction will be the normal of the plane, an offset can be set in normal direction - "POINTFACE": the work plane is referenced by a point (brep-vertex, sketch-point or work-point) and plane (brep-face or work-plane), where the plane reference defines the normal direction of the work plane, an offset can be set - "LINEPLANEANGLE": the work plane is refereced by a line (brep-edge, sketch-line or work-axis) and plane (brep-face or work-plane), where the line's midpoint defines the position and the plane the normal of the work plane, an angle can be set to define rotation around line reference |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                                                                                                              | selected edges, vertices, faces, depends on the type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| [param.offset]     | <code>real</code> \| [<code>expression</code>](#expression)                                                                                                                                                                                                               | offset in normal direction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| [param.angle]      | <code>real</code> \| [<code>expression</code>](#expression)                                                                                                                                                                                                               | angle for type "LINEPLANEANGLE" in radians                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| [param.position]   | <code>point</code> \| [<code>expression</code>](#expression)                                                                                                                                                                                                              | position of the work plane for type "USERDEFINED"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| [param.normal]     | <code>point</code> \| [<code>expression</code>](#expression)                                                                                                                                                                                                              | normal vector of the work plane for type "USERDEFINED"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

**Example**

```js
api.v1.part.updateWorkPlane({ id: workPlane, offset: 100 })
api.v1.part.updateWorkPlane({ id: workPlane, type: 'LINEPLANEANGLE', angle: '45deg' })
```

<a name="updateWorkPoint"></a>

## updateWorkPoint(param)

Updates a work point feature.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the work point feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                                                                                                                                                                                                                                                                                | Default                            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                                                                                                                                                                                                                                                                                 |                                    | object containing the parameters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                                                                                                                                                         |                                    | id of the work point to update                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| [param.name]       | <code>string</code>                                                                                                                                                                                                                                                                                                 | <code>&quot;WorkPoint&quot;</code> | name of the work point feature (default="WorkPoint")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| [param.type]       | <code>&quot;USERDEFINED&quot;</code> \| <code>&quot;BREPVERTEX&quot;</code> \| <code>&quot;EDGEMIDPOINT&quot;</code> \| <code>&quot;CENTER&quot;</code> \| <code>&quot;BARYCENTER&quot;</code> \| <code>&quot;INTERSECTION&quot;</code> \| <code>&quot;INNERCIRCLE&quot;</code> \| <code>&quot;2POINTS&quot;</code> |                                    | type of the work point - "USERDEFINED": the work point has no reference, it's defined by position - "BREPVERTEX": the work point is referenced by a point (brep-vertex or sketch-point) at its position - "EDGEMIDPOINT": the work point is referenced by curve (brep-edge or sketch-line) at its mid point - "CENTER": the work point is referenced by a curve/circle (brep-vertex or sketch-line) at their center - "BARYCENTER": the work point is referenced by a plane (brep-face or work-plane) at its bary center - "INTERSECTION": the work point is referenced by two curves (brep-edge or sketch-line) at their intersection - "INNERCIRCLE": the work point is referenced by three curves (brep-edge or sketch-line) at their inner cirlce - "2POINTS": the work point is referenced by two points (brep-vertex or sketch-point) at the middle of them |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                                                                                                                                                        |                                    | selected edges, vertices, faces, not needed if type = "USERDEFINED"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| [param.position]   | <code>point</code> \| [<code>expression</code>](#expression)                                                                                                                                                                                                                                                        |                                    | position of the work point for type "USERDEFINED"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

**Example**

```js
api.v1.part.updateWorkPoint({ id: workPoint, position: [60, 50, 0] })
```

<a name="workAxis"></a>

## workAxis(param)

Creates a work axis feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the work axis feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                                                                                                                                                      | Default                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                                                                                                                                                       |                                      | object containing the parameters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                               |                                      | id of the part to create work axis in                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| [param.name]       | <code>string</code>                                                                                                                                                                       | <code>&quot;WorkAxis&quot;</code>    | name of the work axis feature (default="WorkAxis")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| [param.type]       | <code>&quot;USERDEFINED&quot;</code> \| <code>&quot;POINTDIRECTION&quot;</code> \| <code>&quot;CURVE&quot;</code> \| <code>&quot;2POINTS&quot;</code> \| <code>&quot;2PLANES&quot;</code> | <code>&quot;USERDEFINED&quot;</code> | type of the work axis (default="USERDEFINED") - "USERDEFINED": the work axis has no reference, it's defined by position and direction - "POINTDIRECTION": the work axis is referenced by a point (brep-vertex, sketch-point or work-point) and direction (brep-edge, sketch-line or work-axis) - "CURVE": the work axis is referenced by curve (brep-edge, sketch-line or work-axis) - "2POINTS": the work axis is referenced by two points (brep-vertex, sketch-point or work-point) - "2PLANES": the work axis is referenced by two planes (brep-face or work-plane) |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                              |                                      | selected edges, vertices, faces, not needed if type = "USERDEFINED"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| [param.position]   | <code>point</code> \| [<code>expression</code>](#expression)                                                                                                                              | <code>[0,0,0]</code>                 | position of the work axis for type "USERDEFINED" (default=[0,0,0])                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| [param.direction]  | <code>point</code> \| [<code>expression</code>](#expression)                                                                                                                              | <code>[1,0,0]</code>                 | normal vector of the work axis for type "USERDEFINED" (default=[1,0,0])                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

**Example**

```js
api.v1.part.workAxis({ id: part, position: [0, 50, 0], direction: [1, 0, 0] })
```

<a name="workCSys"></a>

## workCSys(param)

Creates a work coordinate system feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the work coordinate system feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                                     | Default                           | Description                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                                      |                                   | object containing the parameters                                                                                                                                                                                            |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code>              |                                   | id of the part to create work coordinate system in                                                                                                                                                                          |
| [param.name]       | <code>string</code>                                                      | <code>&quot;WorkCSys&quot;</code> | name of the work coordinate system feature (default="WorkCSys")                                                                                                                                                             |
| [param.type]       | <code>&quot;CUSTOM&quot;</code> \| <code>&quot;XYAXISORIGIN&quot;</code> | <code>&quot;CUSTOM&quot;</code>   | type of the work coordinate system (default="CUSTOM") - "CUSTOM": means that it's created in the origin with global directions (x, y) - "XYAXISORIGIN": means that the origin and the directions can be set with references |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                             |                                   | references of origin, first axis and second axis, not needed if type = "CUSTOM"                                                                                                                                             |
| [param.offset]     | <code>point</code> \| [<code>expression</code>](#expression)             | <code>[0,0,0]</code>              | offset as vector along axis (default=[0,0,0])                                                                                                                                                                               |
| [param.rotation]   | <code>point</code> \| [<code>expression</code>](#expression)             | <code>[0,0,0]</code>              | rotation as vector around axis in radians (default=[0,0,0])                                                                                                                                                                 |
| [param.inverted]   | [<code>boolean</code>](#boolean)                                         | <code>FALSE</code>                | if true, the work coordinate system will be inverted at x-axis (default=FALSE)                                                                                                                                              |

**Example**

```js
api.v1.part.workCSys({ id: part, offset: [100, 100, 0] })
api.v1.part.workCSys({ id: part, type: 'CUSTOM', rotation: [0, 0, 1.57] })
```

<a name="workPlane"></a>

## workPlane(param)

Creates a work plane feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the work plane feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                                                                                                                                                                                                                                      | Default                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                                                                                                                                                                                                                                       |                                      | object containing the parameters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                                                                                                               |                                      | id of the part to create work plane in                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| [param.name]       | <code>string</code>                                                                                                                                                                                                                                                       | <code>&quot;WorkPlane&quot;</code>   | name of the work plane feature (default="WorkPlane")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| [param.type]       | <code>&quot;USERDEFINED&quot;</code> \| <code>&quot;PLANE&quot;</code> \| <code>&quot;EDGEPOINT&quot;</code> \| <code>&quot;3POINTS&quot;</code> \| <code>&quot;POINTNORMAL&quot;</code> \| <code>&quot;POINTFACE&quot;</code> \| <code>&quot;LINEPLANEANGLE&quot;</code> | <code>&quot;USERDEFINED&quot;</code> | type of the work plane (default="USERDEFINED") - "USERDEFINED": the work plane has no reference, it's defined by normal, position and offset - "PLANE": the work plane is referenced by a plane (brep-face or work-plane), an offset can be set - "EDGEPOINT": the work plane is referenced by an edge (brep-edge, sketch-line or work-axis) and point (brep-vertex, sketch-point or work-point), an offset can be set - "3POINTS": the work plane is referenced by three points (brep-vertex, sketch-point or work-point), an offset can be set - "POINTNORMAL": the work plane is referenced by a point (brep-vertex, sketch-point or work-point) and direction (brep-edge, sketch-line or work-axis), where the direction will be the normal of the plane, an offset can be set in normal direction - "POINTFACE": the work plane is referenced by a point (brep-vertex, sketch-point or work-point) and plane (brep-face or work-plane), where the plane reference defines the normal direction of the work plane, an offset can be set - "LINEPLANEANGLE": the work plane is refereced by a line (brep-edge, sketch-line or work-axis) and plane (brep-face or work-plane), where the line's midpoint defines the position and the plane the normal of the work plane, an angle can be set to define rotation around line reference |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                                                                                                              |                                      | selected edges, vertices, faces, not needed if type = "USERDEFINED"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [param.offset]     | <code>real</code> \| [<code>expression</code>](#expression)                                                                                                                                                                                                               | <code>0</code>                       | offset in normal direction (default=0)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| [param.angle]      | <code>real</code> \| [<code>expression</code>](#expression)                                                                                                                                                                                                               | <code>0</code>                       | angle for type "LINEPLANEANGLE" (default=0) in radians                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| [param.position]   | <code>point</code> \| [<code>expression</code>](#expression)                                                                                                                                                                                                              | <code>[0,0,0]</code>                 | position of the work plane for type "USERDEFINED" (default=[0,0,0])                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [param.normal]     | <code>point</code> \| [<code>expression</code>](#expression)                                                                                                                                                                                                              | <code>[1,0,0]</code>                 | normal vector of the work plane for type "USERDEFINED" (default=[1,0,0])                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

**Example**

```js
api.v1.part.workPlane({ id: part, offset: 100 })
api.v1.part.workPlane({ id: part, type: 'LINEPLANEANGLE', references: [74, 82], angle: '45deg' })
```

<a name="workPoint"></a>

## workPoint(param)

Creates a work point feature.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.part function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the work point feature
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param              | Type                                                                                                                                                                                                                                                                                                                | Default                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param              | <code>object</code>                                                                                                                                                                                                                                                                                                 |                                      | object containing the parameters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| param.id           | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                                                                                                                                                         |                                      | id of the part to create work point in                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| [param.name]       | <code>string</code>                                                                                                                                                                                                                                                                                                 | <code>&quot;WorkPoint&quot;</code>   | name of the work point feature (default="WorkPoint")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [param.type]       | <code>&quot;USERDEFINED&quot;</code> \| <code>&quot;BREPVERTEX&quot;</code> \| <code>&quot;EDGEMIDPOINT&quot;</code> \| <code>&quot;CENTER&quot;</code> \| <code>&quot;BARYCENTER&quot;</code> \| <code>&quot;INTERSECTION&quot;</code> \| <code>&quot;INNERCIRCLE&quot;</code> \| <code>&quot;2POINTS&quot;</code> | <code>&quot;USERDEFINED&quot;</code> | type of the work point (default="USERDEFINED") - "USERDEFINED": the work point has no reference, it's defined by position - "BREPVERTEX": the work point is referenced by a point (brep-vertex or sketch-point) at its position - "EDGEMIDPOINT": the work point is referenced by curve (brep-edge or sketch-line) at its mid point - "CENTER": the work point is referenced by a curve/circle (brep-vertex or sketch-line) at their center - "BARYCENTER": the work point is referenced by a plane (brep-face or work-plane) at its bary center - "INTERSECTION": the work point is referenced by two curves (brep-edge or sketch-line) at their intersection - "INNERCIRCLE": the work point is referenced by three curves (brep-edge or sketch-line) at their inner cirlce - "2POINTS": the work point is referenced by two points (brep-vertex or sketch-point) at the middle of them |
| [param.references] | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                                                                                                                                                        |                                      | selected edges, vertices, faces, not needed if type = "USERDEFINED"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| [param.position]   | <code>point</code> \| [<code>expression</code>](#expression)                                                                                                                                                                                                                                                        | <code>[0,0,0]</code>                 | position of the work point for type "USERDEFINED" (default=[0,0,0])                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

**Example**

```js
api.v1.part.workPoint({ id: part, position: [0, 50, 0] })
```
