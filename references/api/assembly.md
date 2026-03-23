<a name="partTemplate"></a>

## partTemplate([param])

Creates a new part and adds it as template to the product container.
This part can be used for assembly building.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the new part template
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                | Default                       | Description                          |
| ------------ | ------------------- | ----------------------------- | ------------------------------------ |
| [param]      | <code>object</code> |                               | object containing all the parameters |
| [param.name] | <code>string</code> | <code>&quot;Part&quot;</code> | Name of the new part template        |

**Example**

```js
api.v1.assembly.partTemplate()
api.v1.assembly.partTemplate({ name: 'Part_152' })
```

<a name="instance"></a>

## instance(param)

Creates instances of products and adds them to root assembly, assembly instance or assembly template.

- If the owner is an instance in the expanded tree, its template in the assembly container will also be updated.
- If the owner is an assembly template, all instances of the template will also be updated

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the created instances
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                  | Type                                                                           | Default                                | Description                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                  | <code>object</code> \| <code>Array&lt;object&gt;</code>                        |                                        | object or objects containing the parameters                                                                                                                                                                                                                                                                                           |
| param.productId        | <code>string</code> \| <code>real</code> \| <code>id</code>                    |                                        | id or identifier of the product to instantiate                                                                                                                                                                                                                                                                                        |
| param.ownerId          | <code>string</code> \| <code>real</code> \| <code>id</code>                    |                                        | id or identifier of the owner of to adding instance, owner can be root assembly, assembly instance or assembly template.                                                                                                                                                                                                              |
| [param.transformation] | <code>Array&lt;point&gt;</code> \| <code>Array&lt;Array&lt;real&gt;&gt;</code> | <code>[[0,0,0],[1,0,0],[0,1,0]]</code> | transformation [origin, x-Dir, y-Dir] of the instance in global coordinates (default=[[0,0,0],[1,0,0],[0,1,0]]) or a 4x4 matrix e.g. [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]] Important: - Left-handed transformation matrices are not yet supported - Scaling part of the 4x4 matrix will be ignored. - Matrices must be orthogonal |
| [param.name]           | <code>string</code>                                                            |                                        | name for the instance, if not set, the instance will get the name of the product with additional unique number, e.g. "MyPart0", "MyPart1"                                                                                                                                                                                             |
| [param.ident]          | <code>string</code>                                                            |                                        | custom string identifier for the added instance.                                                                                                                                                                                                                                                                                      |
| [param.isLocal]        | <code>boolean</code>                                                           | <code>FALSE</code>                     | flag to define whether the transformation is local to owner or global (default=FALSE). This flag gets important if instances are created and added in sub assemblies. In this case, you probably want to add the instance locally to its owner.                                                                                       |

**Example**

```js
api.v1.assembly.instance({ productId: part, ownerId: assemblyRoot })
api.v1.assembly.instance({
  productId: assembly,
  ownerId: instance,
  transformation: [
    [125, 0, 250],
    [1, 0, 0],
    [0, 1, 0],
  ],
})
api.v1.assembly.instance({
  productId: part,
  ownerId: template,
  transformation: [
    [1, 0, 0, 125],
    [0, 1, 0, 0],
    [0, 0, 1, 250],
    [0, 0, 0, 1],
  ],
  isLocal: TRUE,
})
```

<a name="create"></a>

## create([param])

Creates a new root assembly. This is the top level assembly.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the created root assembly
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param         | Type                | Default                               | Description                                            |
| ------------- | ------------------- | ------------------------------------- | ------------------------------------------------------ |
| [param]       | <code>object</code> |                                       | object containing all the parameters                   |
| [param.name]  | <code>string</code> | <code>&quot;AssemblyRoot&quot;</code> | name for the root assembly                             |
| [param.ident] | <code>string</code> |                                       | custom string identifier for the created root assembly |

**Example**

```js
api.v1.assembly.create()
```

<a name="getPartTemplate"></a>

## getPartTemplate([param])

Returns the part template with given name from part container.
If name is empty, all parts from part container will be returned.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|Array<id>  // id or ids of the found part templates
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                | Description                          |
| ------------ | ------------------- | ------------------------------------ |
| [param]      | <code>object</code> | object containing all the parameters |
| [param.name] | <code>string</code> | name of the part to look for         |

**Example**

```js
api.v1.assembly.getPartTemplate()
api.v1.assembly.getPartTemplate({ name: 'Part_125' })
```

<a name="linearPattern"></a>

## linearPattern(param)

Creates a new linear pattern constraint.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: { constraint: id, instances: Array<id> }|VOID|Array<{ constraint: id, instances: Array<id> }|VOID>  // Object or objects with ids of the created linear pattern constraints and their instances
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                  | Type                                                                                                                                                                                | Default                                | Description                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| param                  | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             |                                        | object or objects containing the parameters                                     |
| param.id               | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                        | id of the assembly to create the linear pattern constraint in                   |
| [param.name]           | <code>string</code>                                                                                                                                                                 | <code>&quot;LinearPattern&quot;</code> | name for the linear pattern constraint                                          |
| param.instanceId       | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                        | id of the instance to be copied                                                 |
| param.mate1            | <code>object</code>                                                                                                                                                                 |                                        | object containing the parameters for mate 1                                     |
| param.mate1.path       | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                        | an array with a full mate path (or with a single instance in the expanded tree) |
| param.mate1.csys       | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                        | id of the work coordinate system to use for this first mate                     |
| [param.mate1.flip]     | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>             | flip type which defines the global main axis of the mate (default="Z")          |
| [param.mate1.reorient] | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>             | orientation around the main axis in 90° steps (default="0")                     |
| [param.dir1]           | <code>object</code>                                                                                                                                                                 |                                        | object containing the parameters for the first direction of the linear pattern  |
| [param.dir1.count]     | <code>real</code>                                                                                                                                                                   | <code>1</code>                         | number of copies over the first direction (default=1)                           |
| [param.dir1.distance]  | <code>real</code>                                                                                                                                                                   | <code>100</code>                       | distance between copies over the first direction (default=100)                  |
| [param.mate2]          | <code>object</code>                                                                                                                                                                 |                                        | object containing the parameters for mate 2                                     |
| param.mate2.path       | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                        | an array with a full mate path (or with a single instance in the expanded tree) |
| param.mate2.csys       | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                        | id of the work coordinate system to use for this second mate                    |
| [param.mate2.flip]     | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>             | flip type which defines the global main axis of the mate (default="Z")          |
| [param.mate2.reorient] | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>             | orientation around the main axis in 90° steps (default="0")                     |
| [param.dir2]           | <code>object</code>                                                                                                                                                                 |                                        | object containing the parameters for the second direction of the linear pattern |
| [param.dir2.count]     | <code>real</code>                                                                                                                                                                   | <code>1</code>                         | number of copies over the second direction (default=1)                          |
| [param.dir2.distance]  | <code>real</code>                                                                                                                                                                   | <code>100</code>                       | distance between copies over the second direction (default=100)                 |

**Example**

```js
api.v1.assembly.linearPattern({ id: assembly, instanceId: instance4, mate1: { path: [instance4], csys: wcs } })
```

<a name="updateLinearPattern"></a>

## updateLinearPattern(param)

Updates an existing linear pattern constraint.
If optional parameters are not set, the constraint will keep the existing values.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: { constraint: id, instances: Array<id> }|VOID|Array<{ constraint: id, instances: Array<id> }|VOID>  // Object or objects with ids of the created linear pattern constraints and their instances
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                  | Type                                                                                                                                                                                | Description                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| param                  | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             | object or objects containing the parameters                                     |
| param.id               | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the linear pattern constraint to update                                   |
| [param.name]           | <code>string</code>                                                                                                                                                                 | name for the linear pattern constraint                                          |
| [param.instanceId]     | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the instance to be copied                                                 |
| [param.mate1]          | <code>object</code>                                                                                                                                                                 | object containing the parameters for mate 1                                     |
| [param.mate1.path]     | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        | an array with a full mate path (or with a single instance in the expanded tree) |
| [param.mate1.csys]     | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the work coordinate system to use for this first mate                     |
| [param.mate1.flip]     | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | flip type which defines the global main axis of the mate                        |
| [param.mate1.reorient] | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | orientation around the main axis in 90° steps                                   |
| [param.dir1]           | <code>object</code>                                                                                                                                                                 | object containing the parameters for the first direction of the linear pattern  |
| [param.dir1.count]     | <code>real</code>                                                                                                                                                                   | number of copies over the first direction                                       |
| [param.dir1.distance]  | <code>real</code>                                                                                                                                                                   | distance between copies over the first direction                                |
| [param.mate2]          | <code>object</code>                                                                                                                                                                 | object containing the parameters for mate 2                                     |
| [param.mate2.path]     | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        | an array with a full mate path (or with a single instance in the expanded tree) |
| [param.mate2.csys]     | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the work coordinate system to use for this second mate                    |
| [param.mate2.flip]     | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | flip type which defines the global main axis of the mate                        |
| [param.mate2.reorient] | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | orientation around the main axis in 90° steps                                   |
| [param.dir2]           | <code>object</code>                                                                                                                                                                 | object containing the parameters for the second direction of the linear pattern |
| [param.dir2.count]     | <code>real</code>                                                                                                                                                                   | number of copies over the second direction                                      |
| [param.dir2.distance]  | <code>real</code>                                                                                                                                                                   | distance between copies over the second direction                               |

**Example**

```js
api.v1.assembly.updateLinearPattern({ id: pattern, instanceId: instance, dir1: { count: 4, distance: 150 } })
```

<a name="getLinearPattern"></a>

## getLinearPattern(param)

Returns the linear pattern constraint of given reference with specified name.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    id: id
    instanceId: id
    name: string
    mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     mate2?: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     dir1: {
       count: real,
       distance: real
     },
     dir2: {
       count: real,
       distance: real
     }
   } | Array<{
     id: id
    instanceId: id
    name: string
    mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     mate2?: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     dir1: {
       count: real,
       distance: real
     },
     dir2: {
       count: real,
       distance: real
     }
   } | VOID> | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                          |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| param      | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters          |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the product or instance to look for constraint |
| param.name | <code>string</code>                                         | the name of the constraint to look for               |

**Example**

```js
api.v1.assembly.getLinearPattern({ id: assemblyTemplate, name: 'LP1' })
```

<a name="getAssemblyTemplate"></a>

## getAssemblyTemplate([param])

Returns the assembly template with given name from assembly container.
If name is empty, all assembly from assembly container will be returned.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|Array<id>  // id or ids of the found assembly templates
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                | Description                          |
| ------------ | ------------------- | ------------------------------------ |
| [param]      | <code>object</code> | object containing all the parameters |
| [param.name] | <code>string</code> | name of the assembly to look for     |

**Example**

```js
api.v1.assembly.getAssemblyTemplate()
api.v1.assembly.getAssemblyTemplate({ name: 'Assembly_02' })
```

<a name="getInstance"></a>

## getInstance(param)

Returns a single, mutliple or all instances of an owner, depending on whether a name is given or not.
The owner is the parent of the instance/instances we're looking for and can be a root assembly,
another instance or an assembly template.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the found instances
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param         | Type                                                        | Description                                                                                                   |
| ------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| param         | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing all the parameters                                                               |
| param.ownerId | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the owner from which we are searching the children for instances that have the name we are looking for. |
| [param.name]  | <code>string</code>                                         | name of the instance to look for                                                                              |

**Example**

```js
api.v1.assembly.getInstance({ ownerId: assemblyRoot, name: 'Inst0' }) // return value = 10
api.v1.assembly.getInstance([
  { ownerId: instance, name: 'Inst0' },
  { ownerId: instance2, name: 'Inst1' },
]) // return value = [10, 15]
api.v1.assembly.getInstance({ ownerId: assemblyTemplate }) // return value = [10, 15, 20]
```

<a name="deleteInstance"></a>

## deleteInstance(param)

Deletes instances from root assembly, other instances or assembly templates.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param     | Type                                         | Description                                   |
| --------- | -------------------------------------------- | --------------------------------------------- |
| param     | <code>object</code>                          | object containing all the parameters          |
| param.ids | <code>Array&lt;(string\|real\|id)&gt;</code> | ids or identifiers of the instances to delete |

**Example**

```js
api.v1.assembly.deleteInstance({ ids: [instance1, instance2, instance3] })
```

<a name="fastened"></a>

## fastened(param)

Creates a new fastened constraint.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the created fastened constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                       | Type                                                                                                                                                                                | Default                           | Description                                                                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                       | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             |                                   | object or objects containing the parameters                                                                                                                         |
| param.id                    | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                   | id of the assembly to create the fastened constraint in                                                                                                             |
| [param.name]                | <code>string</code>                                                                                                                                                                 | <code>&quot;Fastened&quot;</code> | name for the fastened constraint (default="Fastened")                                                                                                               |
| param.mate1                 | <code>object</code>                                                                                                                                                                 |                                   | object containing the parameters for mate 1                                                                                                                         |
| param.mate1.path            | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                   | an array with a full mate path (or with a single instance in the expanded tree)                                                                                     |
| param.mate1.csys            | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                   | id of the work coordinate system to use for this first mate                                                                                                         |
| [param.mate1.flip]          | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>        | flip type which defines the global main axis of the mate (default="Z")                                                                                              |
| [param.mate1.reorient]      | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>        | orientation around the main axis in 90° steps (default="0")                                                                                                         |
| param.mate2                 | <code>object</code>                                                                                                                                                                 |                                   | object containing the parameters for mate 2                                                                                                                         |
| param.mate2.path            | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                   | an array with a full mate path (or with a single instance in the expanded tree)                                                                                     |
| param.mate2.csys            | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                   | id of the work coordinate system to use for this second mate                                                                                                        |
| [param.mate2.flip]          | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>        | flip type which defines the global main axis of the mate 2 (default="Z")                                                                                            |
| [param.mate2.reorient]      | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>        | orientation around the main axis in 90° steps (default="0")                                                                                                         |
| [param.xOffset]             | <code>real</code>                                                                                                                                                                   | <code>0</code>                    | offset along x-axis from mate1 to mate2 (default=0)                                                                                                                 |
| [param.yOffset]             | <code>real</code>                                                                                                                                                                   | <code>0</code>                    | offset along y-axis from mate1 to mate2 (default=0)                                                                                                                 |
| [param.zOffset]             | <code>real</code>                                                                                                                                                                   | <code>0</code>                    | offset along z-axis from mate1 to mate2 (default=0)                                                                                                                 |
| [param.xRotation]           | <code>real</code> \| <code>expression</code>                                                                                                                                        | <code>0</code>                    | rotation of mate2 in radians around x-axis of mate1 (default=0). It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| [param.yRotation]           | <code>real</code> \| <code>expression</code>                                                                                                                                        | <code>0</code>                    | rotation of mate2 in radians around y-axis of mate1 (default=0) It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ...  |
| [param.zRotation]           | <code>real</code> \| <code>expression</code>                                                                                                                                        | <code>0</code>                    | rotation of mate2 in radians around z-axis of mate1 (default=0) It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ...  |
| [param.useCurrentTransform] | <code>boolean</code>                                                                                                                                                                | <code>FALSE</code>                | a flag to ignore specified offsets / rotations and recalculate them according to mates' current transforms (default=FALSE)                                          |

**Example**

```js
api.v1.assembly.fastened({ id: assembly, mate1: { path: [instance], csys: wcs }, mate2: { path: [instance3], csys: wcs } })
api.v1.assembly.fastened({
  id: assembly,
  mate1: { path: [instance], csys: wcs },
  mate2: { path: [instance3], csys: wcs },
  xRotation: '45deg',
})
```

<a name="updateFastened"></a>

## updateFastened(param)

Updates an existing fastened constraint.
If optional parameters are not set, the constraint will keep the existing values.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the updated fastened constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                       | Type                                                                                                                                                                                | Default            | Description                                                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                       | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             |                    | object or objects containing the parameters                                                                                                             |
| param.id                    | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                    | id of the fastened constraint to update                                                                                                                 |
| [param.name]                | <code>string</code>                                                                                                                                                                 |                    | name for the fastened constraint                                                                                                                        |
| [param.mate1]               | <code>object</code>                                                                                                                                                                 |                    | object containing the parameters for mate 1                                                                                                             |
| [param.mate1.path]          | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                    | an array with a full mate path (or with a single instance in the expanded tree)                                                                         |
| [param.mate1.csys]          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                    | id of the work coordinate system to use for this first mate                                                                                             |
| [param.mate1.flip]          | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> |                    | flip type which defines the global main axis of the mate                                                                                                |
| [param.mate1.reorient]      | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           |                    | orientation around the main axis in 90° steps                                                                                                           |
| [param.mate2]               | <code>object</code>                                                                                                                                                                 |                    | object containing the parameters for mate 2                                                                                                             |
| [param.mate2.path]          | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                    | an array with a full mate path (or with a single instance in the expanded tree)                                                                         |
| [param.mate2.csys]          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                    | id of the work coordinate system to use for this second mate                                                                                            |
| [param.mate2.flip]          | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> |                    | flip type which defines the global main axis of the mate 2                                                                                              |
| [param.mate2.reorient]      | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           |                    | orientation around the main axis in 90° steps                                                                                                           |
| [param.xOffset]             | <code>real</code>                                                                                                                                                                   |                    | offset along x-axis from mate1 to mate2                                                                                                                 |
| [param.yOffset]             | <code>real</code>                                                                                                                                                                   |                    | offset along y-axis from mate1 to mate2                                                                                                                 |
| [param.zOffset]             | <code>real</code>                                                                                                                                                                   |                    | offset along z-axis from mate1 to mate2                                                                                                                 |
| [param.xRotation]           | <code>real</code> \| <code>expression</code>                                                                                                                                        |                    | rotation of mate2 in radians around x-axis of mate1. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| [param.yRotation]           | <code>real</code> \| <code>expression</code>                                                                                                                                        |                    | rotation of mate2 in radians around y-axis of mate1. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| [param.zRotation]           | <code>real</code> \| <code>expression</code>                                                                                                                                        |                    | rotation of mate2 in radians around z-axis of mate1. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| [param.useCurrentTransform] | <code>boolean</code>                                                                                                                                                                | <code>FALSE</code> | a flag to ignore specified offsets / rotations and recalculate them according to mates' current transforms (default=FALSE)                              |

**Example**

```js
api.v1.assembly.updateFastened({ id: constraint, mate1: { csys: wcs1 }, xOffset: 150 })
api.v1.assembly.updateFastened({ id: constraint, xRotation: '45deg', yRotation: 1.57 })
```

<a name="getFastened"></a>

## getFastened(param)

Returns the fastened constraint of given reference with specified name.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
 {
  result: {
    id: id
    name: string
    mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
    }
    mate2: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
    }
    xOffset: real
    yOffset: real
    zOffset: real
    xRotation: real
    yRotation: real
    zRotation: real
  } | Array<{
    id: id
    name: string
    mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
    }
    mate2: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
    }
    xOffset: real
    yOffset: real
    zOffset: real
    xRotation: real
    yRotation: real
    zRotation: real
  } | VOID> | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                           |
| ---------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| param      | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters           |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the assembly or instance to look for constraint |
| param.name | <code>string</code>                                         | the name of the constraint to look for                |

**Example**

```js
api.v1.assembly.getFastened({ id: assembly, name: 'Fastened3' })
```

<a name="getFastenedOrigin"></a>

## getFastenedOrigin(param)

Returns the fastened origin constraint of given reference with specified name.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
 {
  result: {
    id: id
    name: string
    mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
    }
    xOffset: real
    yOffset: real
    zOffset: real
    xRotation: real
    yRotation: real
    zRotation: real
  } | Array<{
    id: id
    name: string
    mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
    }
    xOffset: real
    yOffset: real
    zOffset: real
    xRotation: real
    yRotation: real
    zRotation: real
  } | VOID> | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                          |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| param      | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters          |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the product or instance to look for constraint |
| param.name | <code>string</code>                                         | the name of the constraint to look for               |

**Example**

```js
api.v1.assembly.getFastenedOrigin({ id: assembly, name: 'FO_5' })
```

<a name="fastenedOrigin"></a>

## fastenedOrigin(param)

Creates a new fastened origin constraint.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the created fastened origin constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                       | Type                                                                                                                                                                                | Default                                 | Description                                                                                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                       | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             |                                         | object or objects containing the parameters                                                                                                                                |
| param.id                    | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                         | id of the assembly to create the fastened origin constraint in                                                                                                             |
| [param.name]                | <code>string</code>                                                                                                                                                                 | <code>&quot;FastenedOrigin&quot;</code> | name for the fastened origin constraint (default="FastenedOrigin")                                                                                                         |
| param.mate1                 | <code>object</code>                                                                                                                                                                 |                                         | object containing the parameters for mate 1                                                                                                                                |
| param.mate1.path            | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                         | an array with a full mate path (or with a single instance in the expanded tree)                                                                                            |
| param.mate1.csys            | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                         | id of the work coordinate system to use for this first mate                                                                                                                |
| [param.mate1.flip]          | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>              | flip type which defines the global main axis of the mate (default="Z")                                                                                                     |
| [param.mate1.reorient]      | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>              | orientation around the main axis in 90° steps (default="0")                                                                                                                |
| [param.xOffset]             | <code>real</code>                                                                                                                                                                   | <code>0</code>                          | offset along x-axis from mate1 to global origin (default=0)                                                                                                                |
| [param.yOffset]             | <code>real</code>                                                                                                                                                                   | <code>0</code>                          | offset along y-axis from mate1 to global origin (default=0)                                                                                                                |
| [param.zOffset]             | <code>real</code>                                                                                                                                                                   | <code>0</code>                          | offset along z-axis from mate1 to global origin (default=0)                                                                                                                |
| [param.xRotation]           | <code>real</code> \| <code>expression</code>                                                                                                                                        | <code>0</code>                          | rotation of mate2 in radians around x-axis of global origin (default=0) It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| [param.yRotation]           | <code>real</code> \| <code>expression</code>                                                                                                                                        | <code>0</code>                          | rotation of mate2 in radians around y-axis of global origin (default=0) It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| [param.zRotation]           | <code>real</code> \| <code>expression</code>                                                                                                                                        | <code>0</code>                          | rotation of mate2 in radians around z-axis of global origin (default=0) It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| [param.useCurrentTransform] | <code>real</code>                                                                                                                                                                   | <code>FALSE</code>                      | a flag to ignore specified offsets / rotations and recalculate them according to mates' current transforms (default=FALSE)                                                 |

**Example**

```js
api.v1.assembly.fastenedOrigin({ id: assembly, mate1: { path: [instance], csys: wcs, flip: '-X' }, xRotation: 3.14 })
```

<a name="updateFastenedOrigin"></a>

## updateFastenedOrigin(param)

Updates an existing fastened origin constraint.
If optional parameters are not set, the constraint will keep the existing values.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the created fastened origin constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                       | Type                                                                                                                                                                                | Default            | Description                                                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                       | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             |                    | object or objects containing the parameters                                                                                                                                 |
| param.id                    | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                    | id of the fastened origin constraint to update                                                                                                                              |
| [param.name]                | <code>string</code>                                                                                                                                                                 |                    | name for the fastened origin constraint                                                                                                                                     |
| [param.mate1]               | <code>object</code>                                                                                                                                                                 |                    | object containing the parameters for mate 1                                                                                                                                 |
| [param.mate1.path]          | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                    | an array with a full mate path (or with a single instance in the expanded tree)                                                                                             |
| [param.mate1.csys]          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                    | id of the work coordinate system to use for this first mate                                                                                                                 |
| [param.mate1.flip]          | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> |                    | flip type which defines the global main axis of the mate                                                                                                                    |
| [param.mate1.reorient]      | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           |                    | orientation around the main axis in 90° steps                                                                                                                               |
| [param.xOffset]             | <code>real</code>                                                                                                                                                                   |                    | offset along x-axis from mate1 to global origin (default=0)                                                                                                                 |
| [param.yOffset]             | <code>real</code>                                                                                                                                                                   |                    | offset along y-axis from mate1 to global origin (default=0)                                                                                                                 |
| [param.zOffset]             | <code>real</code>                                                                                                                                                                   |                    | offset along z-axis from mate1 to global origin (default=0)                                                                                                                 |
| [param.xRotation]           | <code>real</code> \| <code>expression</code>                                                                                                                                        |                    | rotation of mate2 in radians around x-axis of global origin (default=0). It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| [param.yRotation]           | <code>real</code> \| <code>expression</code>                                                                                                                                        |                    | rotation of mate2 in radians around y-axis of global origin (default=0). It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| [param.zRotation]           | <code>real</code> \| <code>expression</code>                                                                                                                                        |                    | rotation of mate2 in radians around z-axis of global origin (default=0). It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| [param.useCurrentTransform] | <code>boolean</code>                                                                                                                                                                | <code>FALSE</code> | a flag to ignore specified offsets / rotations and recalculate them according to mates' current transforms (default=FALSE)                                                  |

**Example**

```js
api.v1.assembly.updateFastenedOrigin({ id: constraint, xOffset: 150, zOffset: 58 })
api.v1.assembly.updateFastenedOrigin({ id: constraint, xOffset: 150, zOffset: 58, zRotation: '15.5deg' })
```

<a name="revolute"></a>

## revolute(param)

Creates a new revolute constraint.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the created revolute constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                                                                                                                                | Default                           | Description                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             |                                   | object or objects containing the parameters                                                                                                        |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                   | id of the assembly to create the revolute constraint in                                                                                            |
| [param.name]              | <code>string</code>                                                                                                                                                                 | <code>&quot;Revolute&quot;</code> | name for the revolute constraint (default="Revolute")                                                                                              |
| param.mate1               | <code>object</code>                                                                                                                                                                 |                                   | object containing the parameters for mate 1                                                                                                        |
| param.mate1.path          | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                   | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| param.mate1.csys          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                   | id of the work coordinate system to use for this first mate                                                                                        |
| [param.mate1.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>        | flip type which defines the global main axis of the mate (default="Z")                                                                             |
| [param.mate1.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>        | orientation around the main axis in 90° steps (default="0")                                                                                        |
| param.mate2               | <code>object</code>                                                                                                                                                                 |                                   | object containing the parameters for mate 2                                                                                                        |
| param.mate2.path          | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                   | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| param.mate2.csys          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                   | id of the work coordinate system to use for this second mate                                                                                       |
| [param.mate2.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>        | flip type which defines the global main axis of the mate 2 (default="Z")                                                                           |
| [param.mate2.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>        | orientation around the main axis in 90° steps (default="0")                                                                                        |
| [param.zOffset]           | <code>real</code>                                                                                                                                                                   | <code>0</code>                    | offset along z-axis from mate1 to mate2 (default=0)                                                                                                |
| [param.zRotationLimits]   | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                                   | object defining min and max value of rotation around z-axis                                                                                        |
| param.zRotationLimits.min | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   |                                   | min value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| param.zRotationLimits.max | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   |                                   | max value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |

**Example**

```js
api.v1.assembly.revolute({ id: assembly, mate1: { path: [instance], csys: wcs }, mate2: { path: [instance2], csys: wcs2 } })
```

<a name="updateRevolute"></a>

## updateRevolute(param)

Updates a revolute constraint.
If optional parameters are not set, the constraint will keep the existing values.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the updated revolute constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                                                                                                                                | Description                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             | object or objects containing the parameters                                                                                                        |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the revolute constraint to update                                                                                                            |
| [param.name]              | <code>string</code>                                                                                                                                                                 | name for the revolute constraint                                                                                                                   |
| [param.mate1]             | <code>object</code>                                                                                                                                                                 | object containing the parameters for mate 1                                                                                                        |
| [param.mate1.path]        | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| [param.mate1.csys]        | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the work coordinate system to use for this first mate                                                                                        |
| [param.mate1.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | flip type which defines the global main axis of the mate                                                                                           |
| [param.mate1.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | orientation around the main axis in 90° steps                                                                                                      |
| [param.mate2]             | <code>object</code>                                                                                                                                                                 | object containing the parameters for mate 2                                                                                                        |
| [param.mate2.path]        | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| [param.mate2.csys]        | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the work coordinate system to use for this second mate                                                                                       |
| [param.mate2.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | flip type which defines the global main axis of the mate 2                                                                                         |
| [param.mate2.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | orientation around the main axis in 90° steps                                                                                                      |
| [param.zOffset]           | <code>real</code>                                                                                                                                                                   | offset along z-axis from mate1 to mate2                                                                                                            |
| [param.zRotationLimits]   | <code>object</code> \| <code>VOID</code>                                                                                                                                            | object defining min and max value of rotation around z-axis                                                                                        |
| param.zRotationLimits.min | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   | min value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| param.zRotationLimits.max | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   | max value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |

**Example**

```js
api.v1.assembly.updateRevolute({ id: constraint, mate2: { flip: '-Z' } })
api.v1.assembly.updateRevolute({ id: constraint, zRotationLimits: { min: '-180deg', max: '270deg' } })
```

<a name="getRevolute"></a>

## getRevolute(param)

Returns the revolute constraint of given reference with specified name.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
 {
  result: {
    id: id
    name: string
    mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
    }
    mate2: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
    }
    zOffset: real
    zRotationLimits: {
       min: real, max: real
     }
  } | Array<{
    id: id
    name: string
    mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
    }
    mate2: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
    }
    zOffset: real
    zRotationLimits: {
       min: real, max: real
     }
  } | VOID> | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                          |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| param      | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters          |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the product or instance to look for constraint |
| param.name | <code>string</code>                                         | the name of the constraint to look for               |

**Example**

```js
api.v1.assembly.getRevolute({ id: assembly, name: 'Rev_12' })
```

<a name="circularPattern"></a>

## circularPattern(param)

Creates a new circular pattern constraint.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: { constraint: id, instances: Array<id> }|VOID|Array<{ constraint: id, instances: Array<id> }|VOID>  // Object or objects with ids of the created circular pattern constraints and their instances
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                  | Type                                                                                                                                                                                | Default                                  | Description                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| param                  | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             |                                          | object or objects containing the parameters                                                                                                     |
| param.id               | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                          | id of the assembly to create the circular pattern constraint in                                                                                 |
| [param.name]           | <code>string</code>                                                                                                                                                                 | <code>&quot;CircularPattern&quot;</code> | name for the circular pattern constraint (default="CircularPattern")                                                                            |
| param.instanceId       | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                          | id of the instance to be copied                                                                                                                 |
| param.mate1            | <code>object</code>                                                                                                                                                                 |                                          | object containing the parameters for this mate                                                                                                  |
| param.mate1.path       | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                          | an array with a full mate path (or with a single instance in the expanded tree)                                                                 |
| param.mate1.csys       | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                          | id of the work coordinate system to use for this mate                                                                                           |
| [param.mate1.flip]     | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>               | flip type which defines the global main axis of the mate (default="Z")                                                                          |
| [param.mate1.reorient] | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>               | orientation around the main axis in 90° steps (default="0")                                                                                     |
| [param.instanceCount]  | <code>real</code>                                                                                                                                                                   | <code>1</code>                           | number of copies (default=1)                                                                                                                    |
| [param.angle]          | <code>real</code> \| <code>expression</code>                                                                                                                                        | <code>0</code>                           | angle in radians between copies (default=0). It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| [param.offset]         | <code>real</code>                                                                                                                                                                   | <code>0</code>                           | offset over the rotational axis between copies (default=0)                                                                                      |

**Example**

```js
api.v1.assembly.circularPattern({
  id: assembly,
  instanceId: instance,
  mate1: { path: [instance], csys: wcs },
  instanceCount: 4,
  angle: 1.57,
})
api.v1.assembly.circularPattern({
  id: assembly,
  instanceId: instance,
  mate1: { path: [instance], csys: wcs },
  instanceCount: 4,
  angle: '90deg',
})
```

<a name="updateCircularPattern"></a>

## updateCircularPattern(param)

Updates an existing circular pattern constraint.
If optional parameters are not set, the feature will keep the existing values.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: { constraint: id, instances: Array<id> }|VOID|Array<{ constraint: id, instances: Array<id> }|VOID>  // Object or objects with ids of the created circular pattern constraints and their instances
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                  | Type                                                                                                                                                                                | Description                                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| param                  | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             | object or objects containing the parameters                                                                                         |
| param.id               | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the circular pattern constraint to update                                                                                     |
| [param.name]           | <code>string</code>                                                                                                                                                                 | name for the circular pattern constraint                                                                                            |
| [param.instanceId]     | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the instance to be copied                                                                                                     |
| [param.mate1]          | <code>object</code>                                                                                                                                                                 | object containing the parameters for this mate                                                                                      |
| [param.mate1.path]     | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        | an array with a full mate path (or with a single instance in the expanded tree)                                                     |
| [param.mate1.csys]     | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the work coordinate system to use for this mate                                                                               |
| [param.mate1.flip]     | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | flip type which defines the global main axis of the mate                                                                            |
| [param.mate1.reorient] | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | orientation around the main axis in 90° steps                                                                                       |
| [param.instanceCount]  | <code>real</code>                                                                                                                                                                   | number of copies                                                                                                                    |
| [param.angle]          | <code>real</code> \| <code>expression</code>                                                                                                                                        | angle in radians between copies. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| [param.offset]         | <code>real</code>                                                                                                                                                                   | offset over the rotational axis between copies                                                                                      |

**Example**

```js
api.v1.assembly.updateCircularPattern({ id: constraint, instanceCount: 3, angle: 2.09 })
```

<a name="cylindrical"></a>

## cylindrical(param)

Creates a new cylindrical constraint.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the created cylindrical constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                                                                                                                                | Default                              | Description                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             |                                      | object or objects containing the parameters                                                                                                        |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                      | id of the assembly to create the cylindrical constraint in                                                                                         |
| [param.name]              | <code>string</code>                                                                                                                                                                 | <code>&quot;Cylindrical&quot;</code> | name for the cylindrical constraint (default="Cylindrical")                                                                                        |
| param.mate1               | <code>object</code>                                                                                                                                                                 |                                      | object containing the parameters for mate 1                                                                                                        |
| param.mate1.path          | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                      | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| param.mate1.csys          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                      | id of the work coordinate system to use for this first mate                                                                                        |
| [param.mate1.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>           | flip type which defines the global main axis of the mate (default="Z")                                                                             |
| [param.mate1.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>           | orientation around the main axis in 90° steps (default="0")                                                                                        |
| param.mate2               | <code>object</code>                                                                                                                                                                 |                                      | object containing the parameters for mate 2                                                                                                        |
| param.mate2.path          | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                      | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| param.mate2.csys          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                      | id of the work coordinate system to use for this second mate                                                                                       |
| [param.mate2.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>           | flip type which defines the global main axis of the mate 2 (default="Z")                                                                           |
| [param.mate2.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>           | orientation around the main axis in 90° steps (default="0")                                                                                        |
| [param.zOffsetLimits]     | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                                      | object defining min and max value of the offset around z-axis                                                                                      |
| param.zOffsetLimits.min   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                                      | min value of the offset along z-axis                                                                                                               |
| param.zOffsetLimits.max   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                                      | max value value of the offset along z-axis                                                                                                         |
| [param.zRotationLimits]   | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                                      | object defining min and max value of rotation around z-axis                                                                                        |
| param.zRotationLimits.min | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   |                                      | min value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| param.zRotationLimits.max | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   |                                      | max value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |

**Example**

```js
api.v1.assembly.cylindrical({ id: assembly, mate1: { path: [instance], csys: wcs }, mate2: { path: [instance2], csys: wcs2 } })
```

<a name="updateCylindrical"></a>

## updateCylindrical(param)

Updates an existing cylindrical constraint.
If optional parameters are not set, the constraint will keep the existing values.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the updated cylindrical constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                                                                                                                                | Description                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             | object or objects containing the parameters                                                                                                        |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the cylindrical constraint to update                                                                                                         |
| [param.name]              | <code>string</code>                                                                                                                                                                 | name for the cylindrical constraint                                                                                                                |
| [param.mate1]             | <code>object</code>                                                                                                                                                                 | object containing the parameters for mate 1                                                                                                        |
| [param.mate1.path]        | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| [param.mate1.csys]        | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the work coordinate system to use for this first mate                                                                                        |
| [param.mate1.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | flip type which defines the global main axis of the mate                                                                                           |
| [param.mate1.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | orientation around the main axis in 90° steps                                                                                                      |
| [param.mate2]             | <code>object</code>                                                                                                                                                                 | object containing the parameters for mate 2                                                                                                        |
| [param.mate2.path]        | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| [param.mate2.csys]        | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the work coordinate system to use for this second mate                                                                                       |
| [param.mate2.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | flip type which defines the global main axis of the mate 2                                                                                         |
| [param.mate2.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | orientation around the main axis in 90° steps                                                                                                      |
| [param.zOffsetLimits]     | <code>object</code> \| <code>VOID</code>                                                                                                                                            | object defining min and max value of the offset around z-axis                                                                                      |
| param.zOffsetLimits.min   | <code>real</code> \| <code>VOID</code>                                                                                                                                              | min value of the offset along z-axis                                                                                                               |
| param.zOffsetLimits.max   | <code>real</code> \| <code>VOID</code>                                                                                                                                              | max value value of the offset along z-axis                                                                                                         |
| [param.zRotationLimits]   | <code>object</code> \| <code>VOID</code>                                                                                                                                            | object defining min and max value of rotation around z-axis                                                                                        |
| param.zRotationLimits.min | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   | min value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| param.zRotationLimits.max | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   | max value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |

**Example**

```js
api.v1.assembly.updateCylindrical({ id: constraint, zRotationLimits: { min: 0, max: 1.57 } })
```

<a name="parallel"></a>

## parallel(param)

Creates a new parallel constraint.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the created parallel constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                       | Type                                                                                                                                                                                | Default                           | Description                                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                       | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             |                                   | object or objects containing the parameters                                                                                                        |
| param.id                    | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                   | id of the assembly to create the parallel constraint in                                                                                            |
| [param.name]                | <code>string</code>                                                                                                                                                                 | <code>&quot;Parallel&quot;</code> | name for the parallel constraint (default="Parallel")                                                                                              |
| param.mate1                 | <code>object</code>                                                                                                                                                                 |                                   | object containing the parameters for mate 1                                                                                                        |
| param.mate1.path            | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                   | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| param.mate1.csys            | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                   | id of the work coordinate system to use for this first mate                                                                                        |
| [param.mate1.flip]          | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>        | flip type which defines the global main axis of the mate (default="Z")                                                                             |
| [param.mate1.reorient]      | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>        | orientation around the main axis in 90° steps (default="0")                                                                                        |
| param.mate2                 | <code>object</code>                                                                                                                                                                 |                                   | object containing the parameters for mate 2                                                                                                        |
| param.mate2.path            | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                   | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| param.mate2.csys            | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                   | id of the work coordinate system to use for this second mate                                                                                       |
| [param.mate2.flip]          | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>        | flip type which defines the global main axis of the mate 2 (default="Z")                                                                           |
| [param.mate2.reorient]      | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>        | orientation around the main axis in 90° steps (default="0")                                                                                        |
| [param.xOffsetLimits]       | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                                   | object defining min and max value of the offset around x-axis                                                                                      |
| [param.xOffsetLimits.min]   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                                   | min value of the offset along x-axis                                                                                                               |
| [param.xOffsetLimits.max]   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                                   | max value value of the offset along x-axis                                                                                                         |
| [param.yOffsetLimits]       | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                                   | object defining min and max value of the offset around y-axis                                                                                      |
| [param.yOffsetLimits.min]   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                                   | min value of the offset along y-axis                                                                                                               |
| [param.yOffsetLimits.max]   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                                   | max value value of the offset along y-axis                                                                                                         |
| [param.zOffsetLimits]       | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                                   | object defining min and max value of the offset around z-axis                                                                                      |
| [param.zOffsetLimits.min]   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                                   | min value of the offset along z-axis                                                                                                               |
| [param.zOffsetLimits.max]   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                                   | max value value of the offset along z-axis                                                                                                         |
| [param.zRotationLimits]     | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                                   | object defining min and max value of rotation around z-axis                                                                                        |
| [param.zRotationLimits.min] | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   |                                   | min value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| [param.zRotationLimits.max] | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   |                                   | max value of rotation around z-axis in radians It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ...  |

**Example**

```js
api.v1.assembly.parallel({ id: assembly, mate1: { path: [instance], csys: wcs }, mate2: { path: [instance2], csys: wcs } })
```

<a name="updateParallel"></a>

## updateParallel(param)

Updates an existing parallel constraint.
If optional parameters are not set, the constraint will keep the existing values.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the updated parallel constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                       | Type                                                                                                                                                                                | Default                    | Description                                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                       | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             |                            | object or objects containing the parameters                                                                                                        |
| param.id                    | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                            | id of the parallel constraint to update                                                                                                            |
| [param.name]                | <code>string</code>                                                                                                                                                                 |                            | name for the parallel constraint                                                                                                                   |
| [param.mate1]               | <code>object</code>                                                                                                                                                                 |                            | object containing the parameters for mate 1                                                                                                        |
| [param.mate1.path]          | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                            | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| [param.mate1.csys]          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                            | id of the work coordinate system to use for this first mate                                                                                        |
| [param.mate1.flip]          | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> |                            | flip type which defines the global main axis of the mate                                                                                           |
| [param.mate1.reorient]      | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code> | orientation around the main axis in 90° steps                                                                                                      |
| [param.mate2]               | <code>object</code>                                                                                                                                                                 |                            | object containing the parameters for mate 2                                                                                                        |
| [param.mate2.path]          | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                            | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| [param.mate2.csys]          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                            | id of the work coordinate system to use for this second mate                                                                                       |
| [param.mate2.flip]          | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> |                            | flip type which defines the global main axis of the mate 2                                                                                         |
| [param.mate2.reorient]      | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           |                            | orientation around the main axis in 90° steps                                                                                                      |
| [param.xOffsetLimits]       | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                            | object defining min and max value of the offset around x-axis                                                                                      |
| [param.xOffsetLimits.min]   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                            | min value of the offset along x-axis                                                                                                               |
| [param.xOffsetLimits.max]   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                            | max value value of the offset along x-axis                                                                                                         |
| [param.yOffsetLimits]       | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                            | object defining min and max value of the offset around y-axis                                                                                      |
| [param.yOffsetLimits.min]   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                            | min value of the offset along y-axis                                                                                                               |
| [param.yOffsetLimits.max]   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                            | max value value of the offset along y-axis                                                                                                         |
| [param.zOffsetLimits]       | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                            | object defining min and max value of the offset around z-axis                                                                                      |
| [param.zOffsetLimits.min]   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                            | min value of the offset along z-axis                                                                                                               |
| [param.zOffsetLimits.max]   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                            | max value value of the offset along z-axis                                                                                                         |
| [param.zRotationLimits]     | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                            | object defining min and max value of rotation around z-axis                                                                                        |
| [param.zRotationLimits.min] | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   |                            | min value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| [param.zRotationLimits.max] | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   |                            | max value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |

**Example**

```js
api.v1.assembly.updateParallel({ id: constraint, zRotationLimits: { min: 0, max: 1.57 } })
```

<a name="planar"></a>

## planar(param)

Creates a new planar constraint.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the created planar constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                                                                                                                                | Default                         | Description                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             |                                 | object or objects containing the parameters                                                                                                        |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                 | id of the assembly to create the planar constraint in                                                                                              |
| [param.name]              | <code>string</code>                                                                                                                                                                 | <code>&quot;Planar&quot;</code> | name for the planar constraint (default="Planar")                                                                                                  |
| param.mate1               | <code>object</code>                                                                                                                                                                 |                                 | object containing the parameters for mate 1                                                                                                        |
| param.mate1.path          | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                 | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| param.mate1.csys          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                 | id of the work coordinate system to use for this first mate                                                                                        |
| [param.mate1.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>      | flip type which defines the global main axis of the mate (default="Z")                                                                             |
| [param.mate1.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>      | orientation around the main axis in 90° steps (default="0")                                                                                        |
| param.mate2               | <code>object</code>                                                                                                                                                                 |                                 | object containing the parameters for mate 2                                                                                                        |
| param.mate2.path          | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                 | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| param.mate2.csys          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                 | id of the work coordinate system to use for this second mate                                                                                       |
| [param.mate2.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>      | flip type which defines the main axis of the mate 2 (default="Z")                                                                                  |
| [param.mate2.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>      | orientation around the main axis in 90° steps (default="0")                                                                                        |
| [param.zOffset]           | <code>real</code>                                                                                                                                                                   | <code>0</code>                  | offset along z-axis from mate1 to mate2 (default=0)                                                                                                |
| [param.xOffsetLimits]     | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                                 | object defining min and max value of the offset around x-axis                                                                                      |
| param.xOffsetLimits.min   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                                 | min value of the offset along x-axis                                                                                                               |
| param.xOffsetLimits.max   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                                 | max value value of the offset along x-axis                                                                                                         |
| [param.yOffsetLimits]     | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                                 | object defining min and max value of the offset around y-axis                                                                                      |
| param.yOffsetLimits.min   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                                 | min value of the offset along y-axis                                                                                                               |
| param.yOffsetLimits.max   | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                                 | max value value of the offset along y-axis                                                                                                         |
| [param.zRotationLimits]   | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                                 | object defining min and max value of rotation around z-axis                                                                                        |
| param.zRotationLimits.min | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   |                                 | min value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| param.zRotationLimits.max | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   |                                 | max value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |

**Example**

```js
api.v1.assembly.planar({ id: assembly, mate1: { path: [instance], csys: wcs }, mate2: { path: [instance2], csys: wcs } })
```

<a name="updatePlanar"></a>

## updatePlanar(param)

Updates an existing planar constraint.
If optional parameters are not set, the constraint will keep the existing values.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the updated planar constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                                                                                                                                | Description                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             | object or objects containing the parameters                                                                                                        |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the planar constraint to update                                                                                                              |
| [param.name]              | <code>string</code>                                                                                                                                                                 | name for the planar constraint                                                                                                                     |
| [param.mate1]             | <code>object</code>                                                                                                                                                                 | object containing the parameters for mate 1                                                                                                        |
| [param.mate1.path]        | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| [param.mate1.csys]        | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the work coordinate system to use for this first mate                                                                                        |
| [param.mate1.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | flip type which defines the global main axis of the mate                                                                                           |
| [param.mate1.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | orientation around the main axis in 90° steps                                                                                                      |
| [param.mate2]             | <code>object</code>                                                                                                                                                                 | object containing the parameters for mate 2                                                                                                        |
| [param.mate2.path]        | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| [param.mate2.csys]        | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the work coordinate system to use for this second mate                                                                                       |
| [param.mate2.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | flip type which defines the main axis of the mate 2                                                                                                |
| [param.mate2.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | orientation around the main axis in 90° steps                                                                                                      |
| [param.zOffset]           | <code>real</code>                                                                                                                                                                   | offset along z-axis from mate1 to mate2                                                                                                            |
| [param.xOffsetLimits]     | <code>object</code> \| <code>VOID</code>                                                                                                                                            | object defining min and max value of the offset around x-axis                                                                                      |
| param.xOffsetLimits.min   | <code>real</code> \| <code>VOID</code>                                                                                                                                              | min value of the offset along x-axis                                                                                                               |
| param.xOffsetLimits.max   | <code>real</code> \| <code>VOID</code>                                                                                                                                              | max value value of the offset along x-axis                                                                                                         |
| [param.yOffsetLimits]     | <code>object</code> \| <code>VOID</code>                                                                                                                                            | object defining min and max value of the offset around y-axis                                                                                      |
| param.yOffsetLimits.min   | <code>real</code> \| <code>VOID</code>                                                                                                                                              | min value of the offset along y-axis                                                                                                               |
| param.yOffsetLimits.max   | <code>real</code> \| <code>VOID</code>                                                                                                                                              | max value value of the offset along y-axis                                                                                                         |
| [param.zRotationLimits]   | <code>object</code> \| <code>VOID</code>                                                                                                                                            | object defining min and max value of rotation around z-axis                                                                                        |
| param.zRotationLimits.min | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   | min value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |
| param.zRotationLimits.max | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   | max value of rotation around z-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |

**Example**

```js
api.v1.assembly.updatePlanar({ id: constraint, xOffsetLimits: { min: 0, max: 150 } })
api.v1.assembly.updatePlanar({ id: constraint, zRotationLimits: { min: '-90deg', max: '90deg' } })
```

<a name="slider"></a>

## slider(param)

Creates a new slider constraint.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the created slider constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                   | Type                                                                                                                                                                                | Default                         | Description                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| param                   | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             |                                 | object or objects containing the parameters                                     |
| param.id                | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                 | id of the assembly to create the slider constraint in                           |
| [param.name]            | <code>string</code>                                                                                                                                                                 | <code>&quot;Slider&quot;</code> | name for the slider constraint (default="Slider")                               |
| param.mate1             | <code>object</code>                                                                                                                                                                 |                                 | object containing the parameters for mate 1                                     |
| param.mate1.path        | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                 | an array with a full mate path (or with a single instance in the expanded tree) |
| param.mate1.csys        | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                 | id of the work coordinate system to use for this first mate                     |
| [param.mate1.flip]      | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>      | flip type which defines the global main axis of the mate (default="Z")          |
| [param.mate1.reorient]  | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>      | orientation around the main axis in 90° steps (default="0")                     |
| param.mate2             | <code>object</code>                                                                                                                                                                 |                                 | object containing the parameters for mate 2                                     |
| param.mate2.path        | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                 | an array with a full mate path (or with a single instance in the expanded tree) |
| param.mate2.csys        | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                 | id of the work coordinate system to use for this second mate                    |
| [param.mate2.flip]      | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>      | flip type which defines the global main axis of the mate 2 (default="Z")        |
| [param.mate2.reorient]  | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>      | orientation around the main axis in 90° steps (default="0")                     |
| [param.xOffset]         | <code>real</code>                                                                                                                                                                   | <code>0</code>                  | offset along x-axis from mate1 to mate2 (default=0)                             |
| [param.yOffset]         | <code>real</code>                                                                                                                                                                   | <code>0</code>                  | offset along y-axis from mate1 to mate2 (default=0)                             |
| [param.zOffsetLimits]   | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                                 | object defining min and max value of the offset around z-axis                   |
| param.zOffsetLimits.min | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                                 | min value of the offset along z-axis                                            |
| param.zOffsetLimits.max | <code>real</code> \| <code>VOID</code>                                                                                                                                              |                                 | max value value of the offset along z-axis                                      |

**Example**

```js
api.v1.assembly.slider({ id: assembly, mate1: { path: [instance], csys: wcs }, mate2: { path: [instance2], csys: wcs } })
```

<a name="updateSlider"></a>

## updateSlider(param)

Updates an existing slider constraint.
If optional parameters are not set, the constraint will keep the existing values.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the updated slider constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                   | Type                                                                                                                                                                                | Description                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| param                   | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             | object or objects containing the parameters                                     |
| param.id                | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the slider constraint to update                                           |
| [param.name]            | <code>string</code>                                                                                                                                                                 | name for the slider constraint                                                  |
| [param.mate1]           | <code>object</code>                                                                                                                                                                 | object containing the parameters for mate 1                                     |
| [param.mate1.path]      | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        | an array with a full mate path (or with a single instance in the expanded tree) |
| [param.mate1.csys]      | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the work coordinate system to use for this first mate                     |
| [param.mate1.flip]      | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | flip type which defines the global main axis of the mate                        |
| [param.mate1.reorient]  | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | orientation around the main axis in 90° steps                                   |
| [param.mate2]           | <code>object</code>                                                                                                                                                                 | object containing the parameters for mate 2                                     |
| [param.mate2.path]      | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        | an array with a full mate path (or with a single instance in the expanded tree) |
| [param.mate2.csys]      | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the work coordinate system to use for this second mate                    |
| [param.mate2.flip]      | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | flip type which defines the global main axis of the mate 2                      |
| [param.mate2.reorient]  | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | orientation around the main axis in 90° steps                                   |
| [param.xOffset]         | <code>real</code>                                                                                                                                                                   | offset along x-axis from mate1 to mate2                                         |
| [param.yOffset]         | <code>real</code>                                                                                                                                                                   | offset along y-axis from mate1 to mate2                                         |
| [param.zOffsetLimits]   | <code>object</code> \| <code>VOID</code>                                                                                                                                            | object defining min and max value of the offset around z-axis                   |
| param.zOffsetLimits.min | <code>real</code> \| <code>VOID</code>                                                                                                                                              | min value of the offset along z-axis                                            |
| param.zOffsetLimits.max | <code>real</code> \| <code>VOID</code>                                                                                                                                              | max value value of the offset along z-axis                                      |

**Example**

```js
api.v1.assembly.updateSlider({ id: constraint, mate1: { path: [instance], csys: wcs }, mate2: { path: [instance2], csys: wcs } })
```

<a name="getCircularPattern"></a>

## getCircularPattern(param)

Returns the circular pattern constraint of given reference with specified name.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    id: id
    instanceId: id
    name: string
    mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
    instanceCount: real
    angle: real
    offset: real
   } | Array<{
    id: id
    instanceId: id
    name: string
    mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
    instanceCount: real
    angle: real
    offset: real
   } | VOID> | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                          |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| param      | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters          |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the product or instance to look for constraint |
| param.name | <code>string</code>                                         | the name of the constraint to look for               |

**Example**

```js
api.v1.assembly.getCircularPattern({ id: 111, name: 'CP1' })
```

<a name="getSlider"></a>

## getSlider(param)

Returns the slider constraint of given reference with specified name.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    id: id
    name: string
     mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     mate2: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     xOffset: real
     yOffset: real
    zOffsetLimits: {
       min: real, max: real
     }
   } | Array<{
    id: id
    name: string
     mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     mate2: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     xOffset: real
     yOffset: real
    zOffsetLimits: {
       min: real, max: real
     }
   } | VOID> | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                          |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| param      | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters          |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the product or instance to look for constraint |
| param.name | <code>string</code>                                         | the name of the constraint to look for               |

**Example**

```js
api.v1.assembly.getSlider({ id: assembly, name: 'Slider_2' })
```

<a name="getParallel"></a>

## getParallel(param)

Returns the parallel constraint of given reference with specified name.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    id: id
    name: string
     mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     mate2: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
    xOffsetLimits: {
       min: real, max: real
     }
    yOffsetLimits: {
       min: real, max: real
     }
    zOffsetLimits: {
       min: real, max: real
     }
    zRotationLimits: {
       min: real, max: real
     }
   } | Array<{
    id: id
    name: string
     mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     mate2: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
    xOffsetLimits: {
       min: real, max: real
     }
    yOffsetLimits: {
       min: real, max: real
     }
    zOffsetLimits: {
       min: real, max: real
     }
    zRotationLimits: {
       min: real, max: real
     }
   } | VOID> | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                          |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| param      | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters          |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the product or instance to look for constraint |
| param.name | <code>string</code>                                         | the name of the constraint to look for               |

**Example**

```js
api.v1.assembly.getParallel({ id: assembly, name: 'Parallel_12' })
```

<a name="getPlanar"></a>

## getPlanar(param)

Returns the planar constraint of given reference with specified name.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    id: id
    name: string
     mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     mate2: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     zOffset: real
    xOffsetLimits: {
       min: real, max: real
     }
    yOffsetLimits: {
       min: real, max: real
     }
    zRotationLimits: {
       min: real, max: real
     }
   } | Array<{
    id: id
    name: string
     mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     mate2: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     zOffset: real
    xOffsetLimits: {
       min: real, max: real
     }
    yOffsetLimits: {
       min: real, max: real
     }
    zRotationLimits: {
       min: real, max: real
     }
   } | VOID> | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                          |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| param      | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters          |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the product or instance to look for constraint |
| param.name | <code>string</code>                                         | the name of the constraint to look for               |

**Example**

```js
api.v1.assembly.getPlanar({ id: assembly, name: 'Planar' })
```

<a name="getCylindrical"></a>

## getCylindrical(param)

Returns the cylindrical constraint of given reference with specified name.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    id: id
    name: string
     mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     mate2: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
    zOffsetLimits: {
       min: real, max: real
     }
    zRotationLimits: {
       min: real, max: real
     }
   } | Array<{
    id: id
    name: string
     mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     mate2: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
    zOffsetLimits: {
       min: real, max: real
     }
    zRotationLimits: {
       min: real, max: real
     }
   } | VOID> | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                          |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| param      | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters          |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the product or instance to look for constraint |
| param.name | <code>string</code>                                         | the name of the constraint to look for               |

**Example**

```js
api.v1.assembly.getCylindrical({ id: instance, name: 'Cylindrical' })
```

<a name="update3DConstraintValue"></a>

## update3DConstraintValue(param)

Updates multiple limited values of constraints

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param       | Type                                                                                                                                               | Description                                                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param       | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                            | object or objects containing the parameters                                                                                                                             |
| param.id    | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                        | id of the constraint to update a value                                                                                                                                  |
| param.name  | <code>&quot;X_OFFSET&quot;</code> \| <code>&quot;Y_OFFSET&quot;</code> \| <code>&quot;Z_OFFSET&quot;</code> \| <code>&quot;Z_ROTATION&quot;</code> | name of the param to update the value                                                                                                                                   |
| param.value | <code>real</code> \| <code>expression</code>                                                                                                       | value to set for the given constraint value, if param.name = "Z_ROTATION" it's possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |

**Example**

```js
api.v1.assembly.update3DConstraintValue({ id: constraint, name: 'X_OFFSET', value: 50 })
api.v1.assembly.update3DConstraintValue({ id: constraint, name: 'Z_ROTATION', value: '135deg' })
```

<a name="convertToTemplate"></a>

## convertToTemplate([param])

Converts the current root assembly into an assembly template
and creates a new root assembly, where the new template can be used
to create instances from.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                | Default                              | Description                                                |
| ------------ | ------------------- | ------------------------------------ | ---------------------------------------------------------- |
| [param]      | <code>object</code> |                                      | object containing the parameters                           |
| [param.name] | <code>string</code> | <code>&quot;Subassembly&quot;</code> | name of the new converted template (default="Subassembly") |

**Example**

```js
api.v1.assembly.convertToTemplate()
```

<a name="exportNode"></a>

## exportNode(param)

Exports a node from the assembly tree or a template from containers.
A node can be any instance (part or assembly) in the tree.
A template can be a part or assembly, doesn't matter if it has already been instantiated or not.
In any case, if the node or template is a part, the root of the created file is a part.
In case of the node or template is an assembly, the root of the created file is a root assembly.
By default the model is written to a data string.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    success: boolean,
    content?: string  // content is the data string of the export and is only available if neither file nor url is defined.
  }
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                         | Default                      | Description                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| param               | <code>object</code>                                          |                              | object containing the parameters                                                                                                                                         |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code>  |                              | id of the node or template to export                                                                                                                                     |
| [param.format]      | <code>&quot;OFB&quot;</code> \| <code>&quot;STP&quot;</code> | <code>&quot;OFB&quot;</code> | the format of exported data of the node or template (default="OFB"). If stored to a file, format is optional (if missing, the file ending is used to define the format). |
| [param.file]        | <code>string</code>                                          |                              | full path of the file. Path has to be a for the ClassCAD process reachable local or UNC path.                                                                            |
| [param.url]         | <code>string</code>                                          |                              | url to send the model data to.                                                                                                                                           |
| [param.encoding]    | <code>&quot;base64&quot;</code>                              |                              | the encoding the data will be encoded with. If compression is also set, the decoding happens after compression!                                                          |
| [param.compression] | <code>&quot;deflate&quot;</code>                             |                              | the compression algorithm the data is compressed with.                                                                                                                   |

**Example**

```js
api.v1.assembly.exportNode({ id: instance, format: 'STP' })
```

<a name="finishMovingUnderConstraints"></a>

## finishMovingUnderConstraints(param)

Finishes moving the constrained objects.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param    | Type                                                        | Description                                         |
| -------- | ----------------------------------------------------------- | --------------------------------------------------- |
| param    | <code>object</code>                                         | object containing the parameters                    |
| param.id | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the assembly which contains the moved objects |

**Example**

```js
api.v1.assembly.finishMovingUnderConstraints({ id: assembly })
```

<a name="moveUnderConstraints"></a>

## moveUnderConstraints(param)

Attempts to move constrained objects.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                        | Default                                                        | Description                                                  |
| ------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| param               | <code>object</code>                                         |                                                                | object containing the parameters                             |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code> |                                                                | id of the assembly which contains the moved objects          |
| [param.rotation]    | <code>object</code>                                         | <code>\{ xDir: [1,0,0], yDir: [0,1,0], zDir: [0,0,1] \}</code> | object containing three consecutive rotation (basis) vectors |
| param.rotation.xDir | <code>point</code>                                          |                                                                | basis vector containing the rotation around x-axis           |
| param.rotation.yDir | <code>point</code>                                          |                                                                | basis vector containing the rotation around y-axis           |
| param.rotation.zDir | <code>point</code>                                          |                                                                | basis vector containing the rotation around z-axis           |
| [param.offset]      | <code>point</code>                                          | <code>[0,0,0]</code>                                           | vector containing the translation                            |

**Example**

```js
api.v1.assembly.moveUnderConstraints({ id: assembly, rotation: { xDir: [0, -1, 0], yDir: [1, 0, 0], zDir: [0, 0, 1] } })
api.v1.assembly.moveUnderConstraints({ id: assembly, offset: [20, 150, 30] })
```

<a name="startMovingUnderConstraints"></a>

## startMovingUnderConstraints(param)

Prepares to move constrained objects.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                                                                                    | Description                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| param             | <code>object</code>                                                                                                     | object containing the parameters                         |
| param.id          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                             | id of the assembly which contains the moved objects      |
| param.instanceIds | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                            | ids of the instances to be moved                         |
| param.pivotInfo   | <code>point</code>                                                                                                      | this is the fixed point, where the object rotates around |
| param.mucType     | <code>&quot;TRANSLATION_1D&quot;</code> \| <code>&quot;TRANSLATION_2D&quot;</code> \| <code>&quot;ROTATION&quot;</code> | type of transformation                                   |

**Example**

```js
api.v1.assembly.startMovingUnderConstraints({ id: assemblyRoot, instanceIds: [instance], pivotInfo: [50, 50, 20], mucType: 'ROTATION' })
```

<a name="transformInstance"></a>

## transformInstance(param)

Transforms instances by the given transformation.
Transforming an instance means, that the same other instances and the template of them will also be transformed.
Important:

- Left-handed transformation matrices are not yet supported
- Scaling part of the 4x4 matrix will be ignored.
- Matrices must be orthogonal

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                | Type                                                        | Default            | Description                                                                                         |
| -------------------- | ----------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| param                | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                    | object or objects containing the parameters                                                         |
| param.id             | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id or identifier of the instance to transform                                                       |
| param.transformation | <code>Array&lt;Array&lt;real&gt;&gt;</code>                 |                    | transformation with 4x4 matrix which transforms the given instance relatively from current position |
| [param.isLocal]      | <code>boolean</code>                                        | <code>FALSE</code> | boolean flag to define whether the transformation is local to owner or global(default=FALSE)        |

**Example**

```js
api.v1.assembly.transformInstance({
  id: instance,
  transformation: [
    [1, 0, 0, 50],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ],
})
```

<a name="transformInstanceTo"></a>

## transformInstanceTo(param)

Transforms instances by the given transformation.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                | Type                                                        | Default            | Description                                                                                               |
| -------------------- | ----------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| param                | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                    | object or objects containing the parameters                                                               |
| param.id             | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | id or identifier of the instance to transform                                                             |
| param.transformation | <code>Array&lt;point&gt;</code>                             |                    | transformation [origin, x-Dir, y-Dir] of the instance in global coordinates to certain absolute position. |
| [param.isLocal]      | <code>boolean</code>                                        | <code>FALSE</code> | boolean flag to define whether the transformation is local to owner or global(default=FALSE)              |

**Example**

```js
api.v1.assembly.transformInstanceTo({
  id: instance,
  transformation: [
    [-10, -10, 0],
    [1, 0, 0],
    [0, 1, 0],
  ],
})
```

<a name="loadProduct"></a>

## loadProduct(param)

Loads a product from file, data or url.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: { id: string|real|id } | VOID  // object containing id of the loaded product
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                         | Default                      | Description                                                                                                                       |
| ------------------- | ------------------------------------------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                          |                              | object containing the parameters                                                                                                  |
| [param.url]         | <code>string</code>                                          |                              | url to load product from                                                                                                          |
| [param.file]        | <code>string</code>                                          |                              | full path of the file. Path has to be a for the ClassCAD process reachable local or UNC path.                                     |
| [param.data]        | <code>string</code>                                          |                              | data/content of the model to load                                                                                                 |
| [param.encoding]    | <code>&quot;base64&quot;</code>                              |                              | the encoding the data is encoded with. If compression is also set, the decoding happens first!                                    |
| [param.compression] | <code>&quot;deflate&quot;</code>                             |                              | the compression algorithm the data is compressed with.                                                                            |
| [param.format]      | <code>&quot;OFB&quot;</code> \| <code>&quot;STP&quot;</code> | <code>&quot;OFB&quot;</code> | content format of to load product (default="OFB"). For load from file, the format is not needed if the extension fits the format. |
| [param.ident]       | <code>string</code>                                          |                              | custom string identifier for the loaded product.                                                                                  |

**Example**

```js
api.v1.assembly.loadProduct({ file: '/var/models/file.stp' })
api.v1.assembly.loadProduct({ url: 'https://.../file.ofb', format: 'OFB' })
api.v1.assembly.loadProduct({ data: 'abc123', format: 'OFB' })
```

<a name="setCurrentInstance"></a>

## setCurrentInstance(param)

Sets the given instance or root assembly as the current. The current product
will also be set to the current instance's product template.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param    | Type                                                        | Description                                                   |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| param    | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters                   |
| param.id | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the instance or root assembly to set as the current one |

**Example**

```js
api.v1.assembly.setCurrentInstance({ id: instance })
```

<a name="setIdent"></a>

## setIdent(param)

Sets a string identifier for an existing object

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param       | Type                                                        | Description                                      |
| ----------- | ----------------------------------------------------------- | ------------------------------------------------ |
| param       | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters      |
| param.id    | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the object to set an identifier on         |
| param.ident | <code>string</code>                                         | identifier for the given object. Must be unique. |

**Example**

```js
api.v1.assembly.setIdent({ id: instance, ident: 'ident_526' })
```

<a name="gear"></a>

## gear(param)

Creates a new gear relation.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the created gear relations
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param           | Type                                                        | Default                               | Description                                                                                                                                                      |
| --------------- | ----------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param           | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                                       | object or objects containing the parameters                                                                                                                      |
| param.id        | <code>string</code> \| <code>real</code> \| <code>id</code> |                                       | id of the assembly to create the gear relation in                                                                                                                |
| [param.name]    | <code>string</code>                                         | <code>&quot;GearRelation&quot;</code> | name for the gear relation (default="GearRelation")                                                                                                              |
| param.constr1Id | <code>string</code> \| <code>real</code> \| <code>id</code> |                                       | id of the first constraint of the relation                                                                                                                       |
| param.constr2Id | <code>string</code> \| <code>real</code> \| <code>id</code> |                                       | id of the second constraint of the relation                                                                                                                      |
| [param.ratio]   | <code>real</code>                                           | <code>1</code>                        | ratio value of rotational velocity (d(constr2.zRotationValue) / d(constr1.zRotationValue)) (default=1)                                                           |
| [param.offset]  | <code>real</code> \| <code>expression</code>                | <code>0</code>                        | offset value of the second mate angle in radians (default=0). It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |

**Example**

```js
api.v1.assembly.gear({ id: assembly, constr1Id: constraint1, constr2Id: constraint2, ratio: 0.5 })
api.v1.assembly.gear({ id: assembly, constr1Id: constraint1, constr2Id: constraint2, offset: '60deg' })
```

<a name="updateGear"></a>

## updateGear(param)

Updates an existing gear relation.
If optional parameters are not set, the constraint will keep the existing values.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the updated gear relations
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                        | Description                                                                                                                                          |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| param             | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters                                                                                                          |
| param.id          | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the gear relation to update                                                                                                                    |
| [param.name]      | <code>string</code>                                         | name for the gear relation                                                                                                                           |
| [param.constr1Id] | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the first constraint of the relation                                                                                                           |
| [param.constr2Id] | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the second constraint of the relation                                                                                                          |
| [param.ratio]     | <code>real</code>                                           | ratio value of rotational velocity (d(constr2.zRotationValue) / d(constr1.zRotationValue))                                                           |
| [param.offset]    | <code>real</code> \| <code>expression</code>                | offset value of the second mate angle in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |

**Example**

```js
api.v1.assembly.updateGear({ id: gear, offset: 1.57 })
api.v1.assembly.updateGear({ id: gear, offset: '90deg' })
```

<a name="group"></a>

## group(param)

Creates a new group constraint.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the created group constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param             | Type                                                        | Default                        | Description                                       |
| ----------------- | ----------------------------------------------------------- | ------------------------------ | ------------------------------------------------- |
| param             | <code>object</code> \| <code>Array&lt;object&gt;</code>     |                                | object or objects containing the parameters       |
| param.id          | <code>string</code> \| <code>real</code> \| <code>id</code> |                                | id of the assembly to create the gear relation in |
| [param.name]      | <code>string</code>                                         | <code>&quot;Group&quot;</code> | name for the group constraint (default="Group")   |
| param.instanceIds | <code>Array&lt;(string\|real\|id)&gt;</code>                |                                | ids of the instances to group                     |

**Example**

```js
api.v1.assembly.group({ id: assembly, instanceIds: [114, 125, 129] })
```

<a name="updateGroup"></a>

## updateGroup(param)

Updates an existing group constraint.
If optional parameters are not set, the constraint will keep the existing values.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the updated group constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                        | Description                                 |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| param               | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the group constraint to update        |
| [param.name]        | <code>string</code>                                         | name for the group constraint               |
| [param.instanceIds] | <code>Array&lt;(string\|real\|id)&gt;</code>                | ids of the instances to group               |

**Example**

```js
api.v1.assembly.updateGroup({ id: group, instanceIds: [114, 129] })
```

<a name="assemblyTemplate"></a>

## assemblyTemplate([param])

Creates a new assembly and adds it as template to the product container.
This assembly can be used for assembly building.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the new assembly template
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                | Default                           | Description                                            |
| ------------ | ------------------- | --------------------------------- | ------------------------------------------------------ |
| [param]      | <code>object</code> |                                   | object containing all the parameters                   |
| [param.name] | <code>string</code> | <code>&quot;Assembly&quot;</code> | name of the new assembly template (default="Assembly") |

**Example**

```js
api.v1.assembly.assemblyTemplate()
```

<a name="from"></a>

## from(param)

Creates an assembly from a json defined assembly or an ecxml definition.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the created root assembly
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param          | Type                                                                                            | Description                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| param          | <code>object</code>                                                                             | object containing all the parameters                                                          |
| [param.url]    | <code>string</code>                                                                             | url to load from                                                                              |
| [param.file]   | <code>string</code>                                                                             | full path of the file. Path has to be a for the ClassCAD process reachable local or UNC path. |
| [param.data]   | <code>string</code>                                                                             | data/content to load from                                                                     |
| [param.format] | <code>&quot;JSON&quot;</code> \| <code>&quot;XML&quot;</code> \| <code>&quot;ECXML&quot;</code> | content format of to load from, has to be passed if load from stream or url                   |

**Example**

```js
api.v1.assembly.from({ file: '/var/models/file.ecxml' })
api.v1.assembly.from({ url: 'https://.../file.ecxml', format: 'ECXML' })
api.v1.assembly.from({ data: 'abc123', format: 'JSON' })
```

<a name="getSpherical"></a>

## getSpherical(param)

Returns the spherical constraint of given reference with specified name.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    id: id
    name: string
     mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     mate2: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
    yRotationLimits: {
       max: real
     }
   } | Array<{
    id: id
    name: string
     mate1: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
     mate2: {
       path: id[],
       csys: id,
       flip: "X" | "-X" | "Y" | "-Y" | "Z" | "-Z",
       reorient: "0" | "90" | "180" | "270"
     }
    yRotationLimits: {
       max: real
     }
   } | VOID> | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                          |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| param      | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters          |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the product or instance to look for constraint |
| param.name | <code>string</code>                                         | the name of the constraint to look for               |

**Example**

```js
api.v1.assembly.getSpherical({ id: assembly, name: 'Spherical2' })
```

<a name="getGroup"></a>

## getGroup(param)

Returns the group constraint of given reference with specified name.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    id: id
     instanceIds: id[]
    name: string
   } | Array<{
    id: id
     instanceIds: id[]
    name: string
   } | VOID> | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                          |
| ---------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| param      | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters          |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the product or instance to look for constraint |
| param.name | <code>string</code>                                         | the name of the constraint to look for               |

**Example**

```js
api.v1.assembly.getGroup({ id: assembly, name: 'Group_Left' })
```

<a name="createUncommitedObject"></a>

## createUncommitedObject(param)

Attention: This method should only be used, if the intention is very clear.
Creates a new uncommited (empty) object in the given assembly.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the created object
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                           |
| ---------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| param      | <code>object</code>                                         | object containing all the parameters                  |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the assembly to create the uncommited object in |
| param.type | <code>string</code>                                         | the type of object to be created                      |
| param.name | <code>string</code>                                         | the name of the object to be created                  |

**Example**

```js
api.v1.assembly.createUncommitedObject({ id: assembly, type: 'CC_FastenedConstraint', name: 'Fastened' })
```

<a name="getGear"></a>

## getGear(param)

Returns the gear relation of given reference with specified name.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    id: id
    name: string
     constr1Id: id
     constr2Id: id
    ratio: real
    offset: real
   } | Array<{
    id: id
    name: string
     constr1Id: id
     constr2Id: id
    ratio: real
    offset: real
   } | VOID> | VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                            |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| param      | <code>object</code> \| <code>Array&lt;object&gt;</code>     | object or objects containing the parameters            |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the product or instance to look for the relation |
| param.name | <code>string</code>                                         | the name of the relation to look for                   |

**Example**

```js
api.v1.assembly.getGear({ id: assembly, name: 'Gear_Left' })
```

<a name="spherical"></a>

## spherical(param)

Creates a new spherical constraint.
If optional parameters are not set, the default values will be used, see (default=xy).

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the created spherical constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                                                                                                                                | Default                            | Description                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             |                                    | object or objects containing the parameters                                                                                                        |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                    | id of the assembly to create the spherical constraint in                                                                                           |
| [param.name]              | <code>string</code>                                                                                                                                                                 | <code>&quot;Spherical&quot;</code> | name for the spherical constraint (default="Spherical")                                                                                            |
| param.mate1               | <code>object</code>                                                                                                                                                                 |                                    | object containing the parameters for mate 1                                                                                                        |
| param.mate1.path          | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                    | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| param.mate1.csys          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                    | id of the work coordinate system to use for this first mate                                                                                        |
| [param.mate1.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>         | flip type which defines the global main axis of the mate (default="Z")                                                                             |
| [param.mate1.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>         | orientation around the main axis in 90° steps (default="0")                                                                                        |
| param.mate2               | <code>object</code>                                                                                                                                                                 |                                    | object containing the parameters for mate 2                                                                                                        |
| param.mate2.path          | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        |                                    | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| param.mate2.csys          | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         |                                    | id of the work coordinate system to use for this second mate                                                                                       |
| [param.mate2.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | <code>&quot;Z&quot;</code>         | flip type which defines the global main axis of the mate 2 (default="Z")                                                                           |
| [param.mate2.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | <code>&quot;0&quot;</code>         | orientation around the main axis in 90° steps (default="0")                                                                                        |
| [param.yRotationLimits]   | <code>object</code> \| <code>VOID</code>                                                                                                                                            |                                    | object defining a max value of rotation around y-axis                                                                                              |
| param.yRotationLimits.max | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   |                                    | max value of rotation around y-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |

**Example**

```js
api.v1.assembly.spherical({ id: assembly, mate1: { path: [instance], csys: wcs }, mate2: { path: [instance2], csys: wcs } })
api.v1.assembly.spherical({
  id: assembly,
  mate1: { path: [instance], csys: wcs },
  mate2: { path: [instance2], csys: wcs },
  yRotationLimits: { max: '45deg' },
})
```

<a name="updateSpherical"></a>

## updateSpherical(param)

Updates an existing spherical constraint.
If optional parameters are not set, the constraint will keep the existing values.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // id or ids of the updated spherical constraints
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                                                                                                                                | Description                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                     | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                             | object or objects containing the parameters                                                                                                        |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the spherical constraint to update                                                                                                           |
| [param.name]              | <code>string</code>                                                                                                                                                                 | name for the spherical constraint                                                                                                                  |
| [param.mate1]             | <code>object</code>                                                                                                                                                                 | object containing the parameters for mate 1                                                                                                        |
| [param.mate1.path]        | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| [param.mate1.csys]        | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the work coordinate system to use for this first mate                                                                                        |
| [param.mate1.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | flip type which defines the global main axis of the mate                                                                                           |
| [param.mate1.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | orientation around the main axis in 90° steps                                                                                                      |
| [param.mate2]             | <code>object</code>                                                                                                                                                                 | object containing the parameters for mate 2                                                                                                        |
| [param.mate2.path]        | <code>Array&lt;(string\|real\|id)&gt;</code>                                                                                                                                        | an array with a full mate path (or with a single instance in the expanded tree)                                                                    |
| [param.mate2.csys]        | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                         | id of the work coordinate system to use for this second mate                                                                                       |
| [param.mate2.flip]        | <code>&quot;X&quot;</code> \| <code>&quot;-X&quot;</code> \| <code>&quot;Y&quot;</code> \| <code>&quot;-Y&quot;</code> \| <code>&quot;Z&quot;</code> \| <code>&quot;-Z&quot;</code> | flip type which defines the global main axis of the mate 2                                                                                         |
| [param.mate2.reorient]    | <code>&quot;0&quot;</code> \| <code>&quot;90&quot;</code> \| <code>&quot;180&quot;</code> \| <code>&quot;270&quot;</code>                                                           | orientation around the main axis in 90° steps                                                                                                      |
| [param.yRotationLimits]   | <code>object</code> \| <code>VOID</code>                                                                                                                                            | object defining a max value of rotation around y-axis                                                                                              |
| param.yRotationLimits.max | <code>real</code> \| <code>expression</code> \| <code>VOID</code>                                                                                                                   | max value of rotation around y-axis in radians. It's also possible to provide an angle expression in degrees as string like "45deg", "135deg", ... |

**Example**

```js
api.v1.assembly.updateSpherical({ id: constraint, mate1: { path: [instance], csys: wcs } })
api.v1.assembly.updateSpherical({ id: constraint, yRotationLimits: { max: 1.57 } })
```

<a name="setCurrentProduct"></a>

## setCurrentProduct(param)

Sets the current product. The current product is exported in the save commando.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id | VOID  // id of the product which was the current one before calling this function
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param    | Type                                                        | Description                                 |
| -------- | ----------------------------------------------------------- | ------------------------------------------- |
| param    | <code>object</code>                                         | object containing the parameters            |
| param.id | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the product to become the current one |

**Example**

```js
api.v1.assembly.setCurrentProduct({ id: assembly })
```

<a name="calculateMassProperties"></a>

## calculateMassProperties(param)

Calculates the center of gravity (cog) and the volume of the given object.
Depending on the input parameter the calculations were made
on a single solid, a part, a subassembly, the whole model, ...
E.g. the center of gravity of a root assembly, will be the sum of all solid's center of gravity
over the whole assembly structure. If a solid is given, the center of gravity will be local to its part.

**Kind**: v1.assembly function  
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
api.v1.assembly.calculateMassProperties({ id: assemblyRoot })
```

<a name="deleteTemplate"></a>

## deleteTemplate(param)

Deletes a part or assembly template.

**Kind**: v1.assembly function  
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
| param.ids | <code>Array&lt;(string\|real\|id)&gt;</code> | ids of the templates to delete       |

**Example**

```js
api.v1.assembly.deleteTemplate({ ids: [796, 852, 963] })
```

<a name="getWorkGeometry"></a>

## getWorkGeometry(param)

Returns the id of the work geometry object with the given name from the given assembly or instance.
Work geometry can be a workpoint, -axis, -plane or -coordinate system.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID  // id of the found work geometry
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                                             |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| param      | <code>object</code>                                         | object containing all the parameters                    |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the assembly or instance to get the geometry from |
| param.name | <code>string</code>                                         | the name of the work geometry to look for               |

**Example**

```js
api.v1.assembly.getWorkGeometry({ id: instance, name: 'WorkCSys_Top' })
```

<a name="deleteConstraint"></a>

## deleteConstraint(param)

Deletes constraints/ relations from assemblies.

**Kind**: v1.assembly function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param     | Type                                         | Description                                               |
| --------- | -------------------------------------------- | --------------------------------------------------------- |
| param     | <code>object</code>                          | object containing all the parameters                      |
| param.ids | <code>Array&lt;(string\|real\|id)&gt;</code> | ids or identifiers of the constraints/relations to delete |

**Example**

```js
api.v1.assembly.deleteConstraint({ ids: [constraint1, constraint2] })
```
