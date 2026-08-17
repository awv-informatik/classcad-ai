<a name="box"></a>

## box(param)

Creates a box

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the created box solid
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                        | Default           | Description                                                                                                                        |
| ------------------- | ----------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                         |                   | object containing all the parameters                                                                                               |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the entity injection feature to create the box solid in                                                                      |
| param.length        | <code>real</code>                                           |                   | length of the box in x-direction                                                                                                   |
| param.width         | <code>real</code>                                           |                   | width of the box in y-direction                                                                                                    |
| param.height        | <code>real</code>                                           |                   | height of the box in z-direction                                                                                                   |
| [param.rotation]    | <code>point</code>                                          |                   | rotation vector containing rotations around x, y, and z-axis                                                                       |
| [param.translation] | <code>point</code>                                          |                   | translation vector along x, y and z-axis                                                                                           |
| [param.rotateFirst] | <code>boolean</code>                                        | <code>TRUE</code> | flag to define whether the box solid should be first rotated or not, when both rotation and translation is provided (default=TRUE) |

**Example**

```js
api.v1.solid.box({ id: entityInjectionFeature, length: 150, width: 55, height: 258 })
api.v1.solid.box({ id: entityInjectionFeature, length: 150, width: 55, height: 258, translation: [0, 0, 150] })
```

<a name="cone"></a>

## cone(param)

Creates a cone

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the created cone solid
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                        | Default           | Description                                                                                                                         |
| ------------------- | ----------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                         |                   | object containing all the parameters                                                                                                |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the entity injection feature to create the cone solid in                                                                      |
| param.height        | <code>real</code>                                           |                   | height of the cone                                                                                                                  |
| param.bDiameter     | <code>real</code>                                           |                   | diameter at the bottom of the cone                                                                                                  |
| param.tDiameter     | <code>real</code>                                           |                   | diameter at the top of the cone                                                                                                     |
| [param.rotation]    | <code>point</code>                                          |                   | rotation vector containing rotations around x, y, and z-axis                                                                        |
| [param.translation] | <code>point</code>                                          |                   | translation vector along x, y and z-axis                                                                                            |
| [param.rotateFirst] | <code>boolean</code>                                        | <code>TRUE</code> | flag to define whether the cone solid should be first rotated or not, when both rotation and translation is provided (default=TRUE) |

**Example**

```js
api.v1.solid.cone({ id: entityInjectionFeature, height: 300, bDiameter: 50, tDiameter: 0.1 })
api.v1.solid.cone({ id: entityInjectionFeature, height: 300, bDiameter: 50, tDiameter: 0.1, rotation: [0, 0, 3.1415] })
api.v1.solid.cone({ id: entityInjectionFeature, height: 300, bDiameter: 50, tDiameter: 0.1, translation: [0, 0, 10] })
```

<a name="copy"></a>

## copy(param)

Creates a copy of the given solid

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the copy solid
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                        | Default           | Description                                                                                                                           |
| ------------------- | ----------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                         |                   | object containing all the parameters                                                                                                  |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the entity injection feature to create copy in                                                                                  |
| param.target        | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the solid to copy                                                                                                               |
| [param.rotation]    | <code>point</code>                                          |                   | rotation vector containing rotations around x, y, and z-axis                                                                          |
| [param.translation] | <code>point</code>                                          |                   | translation vector along x, y and z-axis                                                                                              |
| [param.rotateFirst] | <code>boolean</code>                                        | <code>TRUE</code> | flag to define whether the copied solid should be first rotated or not, when both rotation and translation is provided (default=TRUE) |

**Example**

```js
api.v1.solid.copy({ id: entityInjectionFeature, target: solid })
api.v1.solid.copy({ id: entityInjectionFeature, target: solid, translation: [0, 0, 10], rotation: [0, 0, 1.57], rotateFirst: FALSE })
```

<a name="cylinder"></a>

## cylinder(param)

Creates a cylinder

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the created cylinder solid
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                        | Default           | Description                                                                                                                             |
| ------------------- | ----------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                         |                   | object containing all the parameters                                                                                                    |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the entity injection feature to create the cylinder solid in                                                                      |
| param.height        | <code>real</code>                                           |                   | height of the cylinder                                                                                                                  |
| param.diameter      | <code>real</code>                                           |                   | diameter of the cylinder                                                                                                                |
| [param.rotation]    | <code>point</code>                                          |                   | rotation vector containing rotations around x, y, and z-axis                                                                            |
| [param.translation] | <code>point</code>                                          |                   | translation vector along x, y and z-axis                                                                                                |
| [param.rotateFirst] | <code>boolean</code>                                        | <code>TRUE</code> | flag to define whether the cylinder solid should be first rotated or not, when both rotation and translation is provided (default=TRUE) |

**Example**

```js
api.v1.solid.cylinder({ id: entityInjectionFeature, height: 300, diameter: 50 })
api.v1.solid.cylinder({ id: entityInjectionFeature, height: 50, diameter: 50, translation: [50, 0, 0] })
```

<a name="deleteSolid"></a>

## deleteSolid(param)

Deletes the given solids or all solids if no solids are provided.

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param       | Type                                                        | Description                                                     |
| ----------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| param       | <code>object</code>                                         | object containing all the parameters                            |
| param.id    | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the entity injection feature to clear solids from         |
| [param.ids] | <code>Array&lt;(string\|real\|id)&gt;</code>                | ids of the solids to delete, if VOID all solids will be deleted |

**Example**

```js
api.v1.solid.deleteSolid({ id: entityInjectionFeature, ids: [solid1, solid, solid3] })
api.v1.solid.deleteSolid({ id: entityInjectionFeature })
```

<a name="extrusion"></a>

## extrusion(param)

Creates an extrusion by extruding a shape or sketch geometry

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the created extrusion solid
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                                                                        | Default           | Description                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                                                                         |                   | object containing all the parameters                                                                                                    |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code>                                                 |                   | id of the entity injection feature to create the extrusion in                                                                           |
| param.direction     | <code>point</code>                                                                                          |                   | direction of the extrusion, includes the distance as well                                                                               |
| param.curves        | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>string</code> \| <code>real</code> \| <code>id</code> |                   | either an array of sketch element ids or a shape id, which is a container for curves created with the curveAPI                          |
| [param.rotation]    | <code>point</code>                                                                                          |                   | rotation vector containing rotations around x, y, and z-axis                                                                            |
| [param.translation] | <code>point</code>                                                                                          |                   | translation vector along x, y and z-axis                                                                                                |
| [param.rotateFirst] | <code>boolean</code>                                                                                        | <code>TRUE</code> | flag to define whether the extruded solid should be first rotated or not, when both rotation and translation is provided (default=TRUE) |

**Example**

```js
api.v1.solid.extrusion({ id: entityInjectionFeature, direction: [0, 0, 120], curves: shape })
api.v1.solid.extrusion({ id: entityInjectionFeature, direction: [0, 0, 120], curves: shape, rotation: [0, 0, 1.57] })
```

<a name="fillet"></a>

## fillet(param)

Creates a fillet at the given edges. Edges can be of different solids.

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id[] | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param         | Type                                                        | Description                                                |
| ------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| param         | <code>object</code>                                         | object containing all the parameters                       |
| param.id      | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the entity injection feature to create the fillet in |
| param.radius  | <code>real</code>                                           | radius of the fillet                                       |
| param.geomIds | <code>Array&lt;(string\|real\|id)&gt;</code>                | ids of the brep edges to create the fillet on              |

**Example**

```js
api.v1.solid.fillet({ id: entityInjectionFeature, radius: 5, geomIds: [85, 89, 93, 97] })
```

<a name="intersection"></a>

## intersection(param)

Creates an intersection between solids

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                        | Default            | Description                                                                  |
| ----------------- | ----------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| param             | <code>object</code>                                         |                    | object containing all the parameters                                         |
| param.id          | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the entity injection feature to create the intersection in             |
| param.target      | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | solid to use as base for this boolean operation                              |
| param.tools       | <code>Array&lt;(string\|real\|id)&gt;</code>                |                    | solids to use as tools for this boolean operation                            |
| [param.keepTools] | <code>boolean</code>                                        | <code>FALSE</code> | flag to define whether the tool solids should be kept or not (default=FALSE) |

**Example**

```js
api.v1.solid.intersection({ id: entityInjectionFeature, target: solid, tools: [solid2] })
```

<a name="merge"></a>

## merge(param)

Creates an merge between solids. This is NOT a union!

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                        | Default            | Description                                                                  |
| ----------------- | ----------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| param             | <code>object</code>                                         |                    | object containing all the parameters                                         |
| param.id          | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the entity injection feature to create the box solid in                |
| param.target      | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | solid to use as base for this merge operation                                |
| param.tools       | <code>Array&lt;(string\|real\|id)&gt;</code>                |                    | solids to use as tools for this merge operation                              |
| [param.keepTools] | <code>boolean</code>                                        | <code>FALSE</code> | flag to define whether the tool solids should be kept or not (default=FALSE) |

**Example**

```js
api.v1.solid.merge({ id: entityInjectionFeature, target: solid, tools: [solid1, solid2], keepTools: TRUE })
```

<a name="mirror"></a>

## mirror(param)

Mirrors the given solid at defined plane

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param           | Type                                                        | Description                                                |
| --------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| param           | <code>object</code>                                         | object containing all the parameters                       |
| param.id        | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the entity injection feature to create the mirror in |
| param.target    | <code>string</code> \| <code>real</code> \| <code>id</code> | solid to mirror                                            |
| param.originPos | <code>point</code>                                          | origin position of the plane to mirror at                  |
| param.normal    | <code>point</code>                                          | normal direction of the plane to mirror at                 |

**Example**

```js
api.v1.solid.mirror({ id: entityInjectionFeature, target: solid, originPos: [50, 0, 0], normal: [0, 0, 1] })
```

<a name="offset"></a>

## offset(param)

Creates an offset solid of the given solid

Note: This functionality is a quite difficult and fragile one. Make sure
you call it only on solids, where you can offset all faces, calculate the new trims AND
dont change the topology of the solid i.e. the number of faces and edges remain the same.

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param          | Type                                                        | Default            | Description                                                                                                                                                                  |
| -------------- | ----------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param          | <code>object</code>                                         |                    | object containing all the parameters                                                                                                                                         |
| param.id       | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the entity injection feature to create the offset in                                                                                                                   |
| param.target   | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | solid to create an offset from                                                                                                                                               |
| param.distance | <code>real</code>                                           |                    | distance of the offset                                                                                                                                                       |
| [param.extend] | <code>boolean</code>                                        | <code>FALSE</code> | extend means that surfaces are extended beyound their current trimming curves (default=FALSE). If FALSE the algorithm fills the gap with fillets with radius equal distance. |

**Example**

```js
api.v1.solid.offset({ id: entityInjectionFeature, target: solid, distance: 10 })
```

<a name="revolve"></a>

## revolve(param)

Creates a revolve by revolving a polyline

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the created revolve solid
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                                                                        | Default           | Description                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                                                                         |                   | object containing all the parameters                                                                                                    |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code>                                                 |                   | id of the entity injection feature to create the revolve in                                                                             |
| param.originPos     | <code>point</code>                                                                                          |                   | origin position of the rotation axis                                                                                                    |
| param.direction     | <code>point</code>                                                                                          |                   | direction of the rotation axis                                                                                                          |
| param.angle         | <code>real</code>                                                                                           |                   | rotation angle of the revolve in radians                                                                                                |
| param.curves        | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>string</code> \| <code>real</code> \| <code>id</code> |                   | either an array of sketch element ids or a shape id, which is a container for curves created with the curveAPI                          |
| [param.rotation]    | <code>point</code>                                                                                          |                   | rotation vector containing rotations around x, y, and z-axis                                                                            |
| [param.translation] | <code>point</code>                                                                                          |                   | translation vector along x, y and z-axis                                                                                                |
| [param.rotateFirst] | <code>boolean</code>                                                                                        | <code>TRUE</code> | flag to define whether the revolved solid should be first rotated or not, when both rotation and translation is provided (default=TRUE) |

**Example**

```js
api.v1.solid.revolve({ id: entityInjectionFeature, direction: [0, 1, 0], originPos: [0, 0, 0], angle: 3.14, curves: shape })
api.v1.solid.revolve({ id: entityInjectionFeature, direction: [0, 1, 0], originPos: [0, 0, 0], angle: 3.14, curves: shape, translation: [20, 0, 20] })
```

<a name="rotation"></a>

## rotation(param)

Rotates the given solid by the given rotation vector. The vector is in coordinates of the part
where the provided solid belongs to.
First the z-part of the rotation vector is performed, then the y-part and finally the x-part.

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param          | Type                                                        | Description                                                  |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| param          | <code>object</code>                                         | object containing all the parameters                         |
| param.id       | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the entity injection feature to create the rotation in |
| param.target   | <code>string</code> \| <code>real</code> \| <code>id</code> | solid to rotate                                              |
| param.rotation | <code>point</code>                                          | rotation vector containing rotations around x, y, and z-axis |

**Example**

```js
api.v1.solid.rotation({ id: entityInjectionFeature, target: solid, rotation: [3.14, 0, 0] })
```

<a name="scale"></a>

## scale(param)

Scales the given solid with a factor. The scale is in coordinates of the part
where the provided solid belongs to.

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                                                        | Description                                               |
| ------------ | ----------------------------------------------------------- | --------------------------------------------------------- |
| param        | <code>object</code>                                         | object containing all the parameters                      |
| param.id     | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the entity injection feature to create the scale in |
| param.target | <code>string</code> \| <code>real</code> \| <code>id</code> | solid to scale                                            |
| param.factor | <code>real</code>                                           | scale factor of the solid                                 |

**Example**

```js
api.v1.solid.scale({ id: entityInjectionFeature, target: solid, factor: 2.5 })
```

<a name="section"></a>

## section(param)

The given solid is sectioned at the given plane.

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the created section array
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param           | Type                                                        | Description                                              |
| --------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| param           | <code>object</code>                                         | object containing all the parameters                     |
| param.id        | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the entity injection feature to create the section |
| param.target    | <code>string</code> \| <code>real</code> \| <code>id</code> | solid to create section in                               |
| param.originPos | <code>point</code>                                          | origin position of the plane to cut at                   |
| param.normal    | <code>point</code>                                          | normal direction of the plane to cut at                  |

**Example**

```js
api.v1.solid.section({ id: entityInjectionFeature, target: solid, originPos: [0, 0, 120], normal: [0, 0, 1] })
```

<a name="slice"></a>

## slice(param)

Cuts the given solid at defined plane. The part on the negative
side of normal vector is removed

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id | VOID  // id of the slice if keepBoth flag is TRUE
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param            | Type                                                        | Default           | Description                                                             |
| ---------------- | ----------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------- |
| param            | <code>object</code>                                         |                   | object containing all the parameters                                    |
| param.id         | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the entity injection feature to create the sliced solid in        |
| param.target     | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | solid to slice                                                          |
| param.originPos  | <code>point</code>                                          |                   | origin position of the plane to cut at                                  |
| param.normal     | <code>point</code>                                          |                   | normal direction of the plane to cut at                                 |
| [param.keepBoth] | <code>boolean</code>                                        | <code>TRUE</code> | flag to define whether both solids should be kept or not (default=TRUE) |

**Example**

```js
api.v1.solid.slice({ id: entityInjectionFeature, target: solid, originPos: [0, 0, 50], normal: [0, 1, 1], keepBoth: FALSE })
```

<a name="sphere"></a>

## sphere(param)

Creates a sphere

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the created sphere solid
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                        | Default           | Description                                                                                                                           |
| ------------------- | ----------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                         |                   | object containing all the parameters                                                                                                  |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of the entity injection feature to create the sphere solid in                                                                      |
| param.radius        | <code>real</code>                                           |                   | radius of the sphere                                                                                                                  |
| [param.rotation]    | <code>point</code>                                          |                   | rotation vector containing rotations around x, y, and z-axis                                                                          |
| [param.translation] | <code>point</code>                                          |                   | translation vector along x, y and z-axis                                                                                              |
| [param.rotateFirst] | <code>boolean</code>                                        | <code>TRUE</code> | flag to define whether the sphere solid should be first rotated or not, when both rotation and translation is provided (default=TRUE) |

**Example**

```js
api.v1.solid.sphere({ id: entityInjectionFeature, radius: 60 })
api.v1.solid.sphere({ id: entityInjectionFeature, radius: 60, rotation: [1.57, 0, 0], translation: [0, 50, 0], rotateFirst: FALSE })
```

<a name="subtraction"></a>

## subtraction(param)

Creates a subtraction between solids

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                        | Default            | Description                                                                  |
| ----------------- | ----------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| param             | <code>object</code>                                         |                    | object containing all the parameters                                         |
| param.id          | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the entity injection feature to create the box solid in                |
| param.target      | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | solid to use as base for this boolean operation                              |
| param.tools       | <code>Array&lt;(string\|real\|id)&gt;</code>                |                    | solids to use as tools for this boolean operation                            |
| [param.keepTools] | <code>boolean</code>                                        | <code>FALSE</code> | flag to define whether the tool solids should be kept or not (default=FALSE) |

**Example**

```js
api.v1.solid.subtraction({ id: entityInjectionFeature, target: solid, tools: [solid2] })
```

<a name="translation"></a>

## translation(param)

Translates the given solid by the given vector. The vector is in coordinates of the part
where the provided solid belongs to.

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                        | Description                                                     |
| ----------------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| param             | <code>object</code>                                         | object containing all the parameters                            |
| param.id          | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the entity injection feature to create the translation in |
| param.target      | <code>string</code> \| <code>real</code> \| <code>id</code> | solid to translate                                              |
| param.translation | <code>point</code>                                          | translation vector along x, y and z-axis                        |

**Example**

```js
api.v1.solid.translation({ id: entityInjectionFeature, target: solid, translation: [0, 0, 85] })
```

<a name="union"></a>

## union(param)

Creates a union between solids

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                        | Default            | Description                                                                  |
| ----------------- | ----------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| param             | <code>object</code>                                         |                    | object containing all the parameters                                         |
| param.id          | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id of the entity injection feature to create the box solid in                |
| param.target      | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | solid to use as base for this boolean operation                              |
| param.tools       | <code>Array&lt;(string\|real\|id)&gt;</code>                |                    | solids to use as tools for this boolean operation                            |
| [param.keepTools] | <code>boolean</code>                                        | <code>FALSE</code> | flag to define whether the tool solids should be kept or not (default=FALSE) |

**Example**

```js
api.v1.solid.union({ id: entityInjectionFeature, target: solid, tools: [solid1, solid2], keepTools: TRUE })
```

<a name="useSolid"></a>

## useSolid(param)

This method allows you to work with solids from other features. The solids from the provided feature will
be returned and available to use within the given entity injection feature.

**Kind**: v1.solid function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id[] | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                  | Type                                                                             | Description                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| param                  | <code>object</code>                                                              | object containing all the parameters                                                                                    |
| param.from             | <code>Array&lt;(string\|real\|id)&gt;</code> \| <code>Array&lt;object&gt;</code> | features as ids to get solids from or as objects containing an id and optional indices                                  |
| param.from[].id        | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the feature to get solids from                                                                                    |
| [param.from[].indices] | <code>Array&lt;real&gt;</code>                                                   | if more than one solid is appended to the feature, the indices can be used to specifiy which solids to get from feature |
| param.in               | <code>string</code> \| <code>real</code> \| <code>id</code>                      | id of the entity injection feature to use the solids in                                                                 |

**Example**

```js
api.v1.solid.useSolid({ from: [feature, feature2], in: entityInjectionFeature })
api.v1.solid.useSolid({ from: [{ id: feature, indices: [0, 1] }], in: entityInjectionFeature })
api.v1.solid.useSolid({ from: [{ id: feature, indices: [0, 1] }, { id: feature2 }], in: entityInjectionFeature })
```
