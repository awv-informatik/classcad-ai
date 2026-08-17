<a name="batch"></a>

## batch(param)

Runs the given api calls in a sequence.

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: Array<{
    result: any | VOID
    messages?: { message: string, level: real, code: real, api: string }[]
    maxLevel?: real
  }>
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                | Type                             | Description                                                               |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------- |
| param                | <code>object</code>              | object containing all the parameters                                      |
| param.jobs           | <code>Array&lt;object&gt;</code> | an array of objects containing api jobs to be executed in one single call |
| param.jobs[].api     | <code>string</code>              | the api of the job to be called                                           |
| [param.jobs[].param] | <code>object</code>              | the parameters to be used for the job api call                            |

**Example**

```js
api.v1.common.batch({ jobs: [{ api: 'v1.common.clear' }, { api: 'v1.part.create' }, { api: 'v1.common.save', param: { format: 'OFB', encoding: 'base64' } }] })
```

<a name="clear"></a>

## clear([param])

Deletes all objects in the current drawing

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param           | Type                                         | Description                                                                                                                                                                                                                                     |
| --------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [param]         | <code>object</code>                          | object containing all the parameters                                                                                                                                                                                                            |
| [param.keepIds] | <code>Array&lt;(string\|real\|id)&gt;</code> | Ids of the objects to keep in the database. Only ClassCAD objects that do not contain geometry and have no persistent reference to the deleted objects may be kept. This parameter should only be set if the consequences are fully understood. |

**Example**

```js
api.v1.common.clear()
```

<a name="clearUserData"></a>

## clearUserData(param)

Clears all entries from user data of given object

**Kind**: v1.common function  
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
| param.id | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the object to clear user data  |

**Example**

```js
api.v1.common.clearUserData({ id: part })
```

<a name="evaluateExpression"></a>

## evaluateExpression(param)

Evaluates an expression.

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: real|point|VOID  // A real or point value of the evaluated expression, or VOID if expression is incorrect
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param            | Type                                                        | Default            | Description                                                                                     |
| ---------------- | ----------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| param            | <code>object</code>                                         |                    | object containing all the parameters                                                            |
| [param.id]       | <code>string</code> \| <code>real</code> \| <code>id</code> |                    | any id which is a child of the root part/assembly like feature id, expression set, ...          |
| param.expression | <code>string</code>                                         |                    | expression string to be evaluated                                                               |
| [param.silent]   | <code>boolean</code>                                        | <code>FALSE</code> | flag to define whether the expression should be evaluated without error message (default=FALSE) |

**Example**

```js
api.v1.common.evaluateExpression({ expression: 'sin(C:PI/2)' })
```

<a name="getAppVersion"></a>

## getAppVersion()

Returns the app version

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: string  // app version or empty string if not available
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

**Example**

```js
api.v1.common.getAppVersion()
```

<a name="getClassFileVersion"></a>

## getClassFileVersion()

Returns the class file version

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: string  // class file version
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

**Example**

```js
api.v1.common.getClassFileVersion()
```

<a name="getDatabaseSettings"></a>

## getDatabaseSettings()

Returns the current general settings from the database

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    isGraphicEnabled: boolean
    isCCGraphicEnabled: boolean
    isInvisibleGraphicEnabled: boolean
    isSketchGraphicEnabled: boolean
    facetingParamsMode: real
    chordHeightTol: real
    angleTol: real
    doCurveTessellation: boolean
  }
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

**Example**

```js
api.v1.common.getDatabaseSettings()
```

<a name="getFacetingParameters"></a>

## getFacetingParameters()

Returns the faceting parameters used to tessellate surfaces and curves.

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: { angleTol: real, chordHeightTol: real }  // object containing faceting parameters as properties
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

**Example**

```js
api.v1.common.getFacetingParameters()
```

<a name="getUserData"></a>

## getUserData(param)

Returns the value from the user data map at given key.
If the key or map does not exist the defaultValue will be returned.

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: string  // value at given key or default value
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                | Type                                                        | Default                   | Description                                                |
| -------------------- | ----------------------------------------------------------- | ------------------------- | ---------------------------------------------------------- |
| param                | <code>object</code>                                         |                           | object containing all the parameters                       |
| param.id             | <code>string</code> \| <code>real</code> \| <code>id</code> |                           | id of the object to get user data from                     |
| param.key            | <code>string</code>                                         |                           | key of user data entry to get value from                   |
| [param.defaultValue] | <code>string</code>                                         | <code>&quot;&quot;</code> | default value to return if key does not exist (default="") |

**Example**

```js
api.v1.common.getUserData({ id: part, key: 'material', defaultValue: 'none' })
```

<a name="getUserDataKeys"></a>

## getUserDataKeys(param)

Returns all the keys of user data map of given object

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: Array<string>  // array of keys
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param    | Type                                                        | Description                           |
| -------- | ----------------------------------------------------------- | ------------------------------------- |
| param    | <code>object</code>                                         | object containing all the parameters  |
| param.id | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the object to get all keys from |

**Example**

```js
api.v1.common.getUserDataKeys({ id: part })
```

<a name="load"></a>

## load(param)

Reads drawing from ClassCAD- or SolidFile, drawing must be cleared or doClear set to TRUE.
Other formats than STEP or ClassCAD are imported to a CC_Part and assembly information is not considered
By default an STL file is loaded as PolyBrep and can mainly be used for visualisation.

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: { id: id } | VOID  // object containing the id of the loaded model
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                | Type                                                                                         | Default            | Description                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| param                | <code>object</code>                                                                          |                    | object containing the parameters                                                                                                              |
| [param.url]          | <code>string</code>                                                                          |                    | url to load file from                                                                                                                         |
| [param.file]         | <code>string</code>                                                                          |                    | full path of the file. Path has to be a for the ClassCAD process reachable local or UNC path.                                                 |
| [param.data]         | <code>string</code>                                                                          |                    | data/content of the model to load. If you want to load binary data, you have to string encode first. See encoding for possible encodings.     |
| [param.format]       | <code>&quot;OFB&quot;</code> \| <code>&quot;STP&quot;</code> \| <code>&quot;IWP&quot;</code> |                    | the format of the data. For load from file, the format is not needed if the extension fits the format.                                        |
| [param.doClear]      | <code>boolean</code>                                                                         | <code>FALSE</code> | if true, the drawing is cleared before loading and BaseModeling is initialised if needed (default=FALSE)                                      |
| [param.ident]        | <code>string</code>                                                                          |                    | custom string identifier for the loaded root product                                                                                          |
| [param.encoding]     | <code>&quot;base64&quot;</code>                                                              |                    | the encoding the data is encoded with. If compression is also set, the decoding happens first! If loading as file, encoding has no influence. |
| [param.compression]  | <code>&quot;deflate&quot;</code>                                                             |                    | the compression algorithm the data is compressed with. If saving as file, compression has no influence.                                       |
| [param.ofb]          | <code>object</code>                                                                          |                    | options to configure the ofb data, if the format == ofb.                                                                                      |
| [param.ofb.geometry] | <code>real</code>                                                                            | <code>2</code>     | (default=2). - 2: use stored geometry - 3: use stored graphics - 4: use stored geometry and graphics                                          |
| [param.stp]          | <code>object</code>                                                                          |                    | options to configure the ofb data, if the format == stp.                                                                                      |
| [param.stp.asPart]   | <code>boolean</code>                                                                         | <code>FALSE</code> | (default=FALSE). - FALSE: stp files are loaded using assembly structure. - TRUE: stp files are loaded into part without assembly structures.  |

**Example**

```js
api.v1.common.load({ url: 'https://.../file.ofb', format: 'OFB' })
api.v1.common.load({ file: '/var/models/file.stp' })
api.v1.common.load({ file: '/var/models/file.stp', stp: { asPart: TRUE } })
api.v1.common.load({ data: 'xx124b', format: 'OFB' })
```

<a name="recalc"></a>

## recalc()

Recalculates and updates the whole drawing with all its objects

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

**Example**

```js
api.v1.common.recalc()
```

<a name="removeUserData"></a>

## removeUserData(param)

Removes the user data entry identified by given key

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param     | Type                                                        | Description                               |
| --------- | ----------------------------------------------------------- | ----------------------------------------- |
| param     | <code>object</code>                                         | object containing all the parameters      |
| param.id  | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the object to remove user data from |
| param.key | <code>string</code>                                         | key of user data entry to remove          |

**Example**

```js
api.v1.common.removeUserData({ id: part, key: 'material' })
```

<a name="requestVisualisation"></a>

## requestVisualisation(param)

Requests the visualisation of the entities/cad entities from the classcad server

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param     | Type                                         | Description                                                 |
| --------- | -------------------------------------------- | ----------------------------------------------------------- |
| param     | <code>object</code>                          | object containing the parameters                            |
| param.ids | <code>Array&lt;(string\|real\|id)&gt;</code> | ids of the entities/ cad entities to get visualisation from |

**Example**

```js
api.v1.common.requestVisualisation({ ids: [solid1, solid2] })
```

<a name="save"></a>

## save(param)

Stores the current model. ofb, scg and step can keep assembly structure, for other formats only the geometry is exported
and assembly information is lost. By default the model is written to a data string.

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    success: boolean,
    content?: string  // content is the data of the model and is only available if neither file nor url is defined.
  }
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                                    | Type                                                                                                                                                                                         | Default                      | Description                                                                                                                                                                                                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                                    | <code>object</code>                                                                                                                                                                          |                              | object containing the parameters                                                                                                                                                                                                                               |
| [param.file]                             | <code>string</code>                                                                                                                                                                          |                              | full path of the file. Path has to be a for the ClassCAD process reachable local or UNC path.                                                                                                                                                                  |
| [param.url]                              | <code>string</code>                                                                                                                                                                          |                              | url to send the model data to.                                                                                                                                                                                                                                 |
| [param.format]                           | <code>&quot;OFB&quot;</code> \| <code>&quot;SCG&quot;</code> \| <code>&quot;STP&quot;</code> \| <code>&quot;IWP&quot;</code> \| <code>&quot;STL&quot;</code> \| <code>&quot;DXF&quot;</code> | <code>&quot;OFB&quot;</code> | the format of data stored (default="OFB"). If stored to a file, format is optional (if missing, the file ending is used to define the format).                                                                                                                 |
| [param.encoding]                         | <code>&quot;base64&quot;</code>                                                                                                                                                              |                              | the encoding the data will be encoded with. If compression is also set, the decoding happens after compression! If saving as file, encoding has no influence.                                                                                                  |
| [param.compression]                      | <code>&quot;deflate&quot;</code>                                                                                                                                                             |                              | the compression algorithm the data is compressed with. If saving as file, compression has no influence.                                                                                                                                                        |
| [param.ofb]                              | <code>object</code>                                                                                                                                                                          |                              | options to configure the ofb data, if the format == ofb.                                                                                                                                                                                                       |
| [param.ofb.version]                      | <code>real</code>                                                                                                                                                                            | <code>-2</code>              | defines the fileformat which is used to write the data. -2 is the most current released version (default=-2).                                                                                                                                                  |
| [param.ofb.geometry]                     | <code>real</code>                                                                                                                                                                            | <code>2</code>               | (default=2). - 0: only store ClassCAD objects. - 1: store objects for class format. - 2: store objects and geometry. - 3: store objects and graphics. - 4: store objects, geometry and graphics.                                                               |
| [param.stp]                              | <code>object</code>                                                                                                                                                                          |                              | options to configure the step data, if the format == stp.                                                                                                                                                                                                      |
| [param.stp.asPart]                       | <code>boolean</code>                                                                                                                                                                         | <code>FALSE</code>           | (default=FALSE). This flag is only available in base modeling - FALSE: step files are written using assembly structure. - TRUE: all geometry in instances is copied to the apropriate place and written to the stepfile into a single PRODUCT as new geometry. |
| [param.stp.analytic]                     | <code>real</code>                                                                                                                                                                            | <code>0</code>               | defines if exported geometry should be converted into analytic geometry (e.g. circle, plane,...) when writing data (default=0).                                                                                                                                |
| [param.stp.version]                      | <code>real</code>                                                                                                                                                                            | <code>2</code>               | defines the step data format. Depending on the format different content may exist in the data. (default=2). - 1: AP203. - 2: AP214. - 3: AP242.                                                                                                                |
| [param.stp.header]                       | <code>object</code>                                                                                                                                                                          |                              | options to configure the header of stp data                                                                                                                                                                                                                    |
| [param.stp.header.filename]              | <code>object</code>                                                                                                                                                                          |                              | options to configure the header's filename properties                                                                                                                                                                                                          |
| [param.stp.header.filename.name]         | <code>string</code>                                                                                                                                                                          |                              | name of the stp data to set in the header's filename                                                                                                                                                                                                           |
| [param.stp.header.filename.organization] | <code>string</code>                                                                                                                                                                          |                              | name of the organization to set in the header's filename of stp data                                                                                                                                                                                           |
| [param.stl]                              | <code>object</code>                                                                                                                                                                          |                              | options to configure the stl data, if the format == stl. Assembly structure is lost.                                                                                                                                                                           |
| [param.stl.facetingTol]                  | <code>real</code>                                                                                                                                                                            | <code>0.1</code>             | max distance between real geometry and approximated segment (default=0.1).                                                                                                                                                                                     |
| [param.stl.angleTol]                     | <code>real</code>                                                                                                                                                                            | <code>6</code>               | max angle between two segments, unit: degree (default=6).                                                                                                                                                                                                      |
| [param.stl.binary]                       | <code>boolean</code>                                                                                                                                                                         | <code>TRUE</code>            | defines if stl data should be binary. Else it is ASCII (default=TRUE).                                                                                                                                                                                         |
| [param.iwp]                              | <code>object</code>                                                                                                                                                                          |                              | options to configure the iwp data, if the format == iwp. Assembly structure is lost. This is an SMLib internal format and can contain more than one geometry.                                                                                                  |
| [param.iwp.binary]                       | <code>boolean</code>                                                                                                                                                                         | <code>FALSE</code>           | (default=FALSE). - FALSE: Data is written in ASCII. - TRUE: File is written binary.                                                                                                                                                                            |
| [param.dxf]                              | <code>object</code>                                                                                                                                                                          |                              | options to configure the dxf data, if the format == dxf. Can only be used to write 2d geometry.                                                                                                                                                                |
| [param.dxf.digits]                       | <code>real</code>                                                                                                                                                                            | <code>16</code>              | number of digits for numbers (default=16).                                                                                                                                                                                                                     |
| [param.dxf.version]                      | <code>real</code>                                                                                                                                                                            | <code>2000</code>            | version for dxf data. Version 2000 is internaly vAC15. The newest supported version is 2013, internaly vAC27 (default=2000).                                                                                                                                   |

**Example**

```js
api.v1.common.save({ format: 'OFB' })
api.v1.common.save({ file: '/var/models/file.stp' })
api.v1.common.save({ url: 'https://.../file.ofb', format: 'OFB' })
api.v1.common.save({ file: '/var/models/file.stp', stp: { asPart: TRUE, version: 1 } })
api.v1.common.save({ file: '/var/models/file.stp', stp: { asPart: TRUE, version: 1, header: { filename: { name: '/var/name.stp' } } } })
api.v1.common.save({ format: 'STL', stl: { facetingTol: 0.5, binary: FALSE } })
```

<a name="setAppearance"></a>

## setAppearance(param)

Sets the appearance on the target, which is here defined by an id which is the feature
and optional inidices to select specific solids from the feature, if more than one solid
is appended.

**Kind**: v1.common function  
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
| param.target           | <code>string</code> \| <code>real</code> \| <code>id</code> \| <code>object</code> | target as id of the feature to set appearance on or as object containing an id and optional indices |
| param.target.id        | <code>string</code> \| <code>real</code> \| <code>id</code>                        | id of the feature, to set the appearance on                                                         |
| [param.target.indices] | <code>Array&lt;real&gt;</code>                                                     | if more than one solid is appended to the feature, the indices can be used to select the solids     |
| [param.color]          | <code>Array&lt;real&gt;</code>                                                     | array of three elements (rgb color), color[0] = r, color[1] = g, color[2] = b in the range of 0-255 |
| [param.transparency]   | <code>real</code>                                                                  | value of transparency between 0 and 1                                                               |
| [param.chordHeightTol] | <code>real</code>                                                                  | chord height tolerance                                                                              |
| [param.angleTol]       | <code>real</code>                                                                  | angle tolerance                                                                                     |

**Example**

```js
api.v1.common.setAppearance({ target: feature, color: [10, 125, 250], transparency: 0.8 })
api.v1.common.setAppearance([
  { target: feature1, color: [10, 125, 250] },
  { target: feature2, transparency: 0.5 },
])
```

<a name="setDatabaseSettings"></a>

## setDatabaseSettings(param)

Sets the current and initial general settings on the database.

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                             | Type                 | Description                                                                                                                                                                     |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                             | <code>object</code>  | object containing all the parameters                                                                                                                                            |
| [param.isGraphicEnabled]          | <code>boolean</code> | flag to define whether graphic will be visible or not                                                                                                                           |
| [param.isCCGraphicEnabled]        | <code>boolean</code> | flag to define whether classcad graphic will be visible or not                                                                                                                  |
| [param.isInvisibleGraphicEnabled] | <code>boolean</code> | flag to define whether invisible graphic will tessellated or not.                                                                                                               |
| [param.isSketchGraphicEnabled]    | <code>boolean</code> | to define whether sketch graphic will be visible or not.                                                                                                                        |
| [param.facetingParamsMode]        | <code>real</code>    | Mode to define which faceting parameters will be used for tessellation. - mode = 0: default parameters will be used - mode = 1: specific parameters of each entity will be used |
| [param.chordHeightTol]            | <code>real</code>    | distance tolerance between geometrical arc and tesselated arc                                                                                                                   |
| [param.angleTol]                  | <code>real</code>    | angle tolerance between two surfaces of tesselation                                                                                                                             |
| [param.doCurveTessellation]       | <code>boolean</code> | flag defines if analytic curves (e.g. arc) are tesselated on server (=true) or on client (=false)                                                                               |

**Example**

```js
api.v1.common.setDatabaseSettings({ chordHeightTol: 0.5 })
```

<a name="setFacetingParameters"></a>

## setFacetingParameters(param)

Sets the faceting parameters of current drawing.

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                  | Type                | Description                                                   |
| ---------------------- | ------------------- | ------------------------------------------------------------- |
| param                  | <code>object</code> | object containing all the parameters                          |
| [param.angleTol]       | <code>real</code>   | angle tolerance between two surfaces of tesselation           |
| [param.chordHeightTol] | <code>real</code>   | distance tolerance between geometrical arc and tesselated arc |

**Example**

```js
api.v1.common.setFacetingParameters({ angleTol: 20 })
```

<a name="setObjectCoordSystem"></a>

## setObjectCoordSystem(param)

Calls "SetObjectCoordSystem" on object or sets object coord system if function does not exist

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param        | Type                                                        | Description                                          |
| ------------ | ----------------------------------------------------------- | ---------------------------------------------------- |
| param        | <code>object</code>                                         | object containing all the parameters                 |
| param.id     | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the object to set the new coordinate system on |
| param.origin | <code>point</code>                                          | origin of the new coordinate system                  |
| param.xVec   | <code>point</code>                                          | x direction of the new coordinate system             |
| param.yVec   | <code>point</code>                                          | y direction of the new coordinate system             |

**Example**

```js
api.v1.common.setObjectCoordSystem({ id: sketch, origin: [0, 150, 0], xVec: [0, 1, 0], yVec: [0, 0, 1] })
```

<a name="setObjectName"></a>

## setObjectName(param)

Calls "SetObjectName" on object or sets object name if function does not exist

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param      | Type                                                        | Description                          |
| ---------- | ----------------------------------------------------------- | ------------------------------------ |
| param      | <code>object</code>                                         | object containing all the parameters |
| param.id   | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the object to set the name on  |
| param.name | <code>string</code>                                         | name to set for the object           |

**Example**

```js
api.v1.common.setObjectName({ id: instance, name: 'Obj_23' })
```

<a name="setUserData"></a>

## setUserData(param)

Sets custom user data by key and value on given object.
If the given object will be copied later, the user data is not copied as well.

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param       | Type                                                        | Description                          |
| ----------- | ----------------------------------------------------------- | ------------------------------------ |
| param       | <code>object</code>                                         | object containing all the parameters |
| param.id    | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the object to set user data on |
| param.key   | <code>string</code>                                         | key as string                        |
| param.value | <code>string</code>                                         | value as string                      |

**Example**

```js
api.v1.common.setUserData({ id: part, key: 'material', value: 'aluminum-1060' })
```

<a name="transformObjectWithMatrix"></a>

## transformObjectWithMatrix(param)

Transforms an object with the given matrix.

**Kind**: v1.common function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param            | Type                                                        | Default           | Description                                                                     |
| ---------------- | ----------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------- |
| param            | <code>object</code>                                         |                   | object containing all the parameters                                            |
| param.id         | <code>string</code> \| <code>real</code> \| <code>id</code> |                   | id of any object to transform                                                   |
| param.matrix     | <code>Array&lt;Array&lt;real&gt;&gt;</code>                 |                   | the 4x4 transformation matrix                                                   |
| [param.isGlobal] | <code>boolean</code>                                        | <code>TRUE</code> | must be TRUE if the given matrix is in global coords, FALSE else (default=TRUE) |

**Example**

```js
api.v1.common.transformObjectWithMatrix({
  id: instance,
  matrix: [
    [1, 0, 0, 100],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ],
})
```
