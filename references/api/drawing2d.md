<a name="centerView"></a>

## centerView(param)

This method centers all given views to origin, depending on each view's boundary box.
This can be useful after creating the views and before placing them

**Kind**: v1.drawing2d function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param         | Type                                                                                                                                                                                                  | Description                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| param         | <code>object</code>                                                                                                                                                                                   | object containing the parameters                             |
| param.id      | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                                           | id of the product to center the views from                   |
| [param.types] | <code>Array&lt;(&quot;TOP&quot;\|&quot;FRONT&quot;\|&quot;RIGHT&quot;\|&quot;LEFT&quot;\|&quot;BOTTOM&quot;\|&quot;RIGHT_90&quot;\|&quot;LEFT_90&quot;\|&quot;BACK&quot;\|&quot;ISO&quot;)&gt;</code> | type of views to center, if empty all views will be centered |

**Example**

```js
api.v1.drawing2d.centerView({ id: part, types: ['TOP', 'ISO'] })
```

<a name="deleteDimension"></a>

## deleteDimension(param)

Deletes one or multiple dimensions of the 2d view

**Kind**: v1.drawing2d function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param     | Type                                         | Description                                  |
| --------- | -------------------------------------------- | -------------------------------------------- |
| param     | <code>object</code>                          | object containing all the parameters         |
| param.ids | <code>Array&lt;(string\|real\|id)&gt;</code> | ids of the dimensions to remove from 2d view |

**Example**

```js
api.v1.drawing2d.deleteDimension({ ids: [58, 96] })
```

<a name="dimension"></a>

## dimension(param)

Creates one or multiple dimensions in the product.
The dimensions will be visible after creating and exporting the views to svg or dxf.

**Kind**: v1.drawing2d function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|VOID|Array<id|VOID>  // one or multiple ids of the created dimensions
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                    | Type                                                                                                                                                                                                                                                                                                           | Default                            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param                    | <code>object</code> \| <code>Array&lt;object&gt;</code>                                                                                                                                                                                                                                                        |                                    | object or objects containing the parameters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| param.id                 | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                                                                                                                                                    |                                    | id of the product to create the dimension in                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| param.viewType           | <code>&quot;TOP&quot;</code> \| <code>&quot;FRONT&quot;</code> \| <code>&quot;RIGHT&quot;</code> \| <code>&quot;LEFT&quot;</code> \| <code>&quot;BOTTOM&quot;</code> \| <code>&quot;RIGHT_90&quot;</code> \| <code>&quot;LEFT_90&quot;</code> \| <code>&quot;BACK&quot;</code> \| <code>&quot;ISO&quot;</code> |                                    | type of the view where the dimension will be visible later in the dxf file                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| param.common             | <code>object</code>                                                                                                                                                                                                                                                                                            |                                    | object containing the common parameters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| param.common.type        | <code>&quot;LINEAR&quot;</code> \| <code>&quot;ANGULAR&quot;</code> \| <code>&quot;RADIAL&quot;</code> \| <code>&quot;DIAMETER&quot;</code>                                                                                                                                                                    |                                    | type of the dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [param.common.name]      | <code>string</code>                                                                                                                                                                                                                                                                                            | <code>&quot;Dimension&quot;</code> | name of the dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [param.common.label]     | <code>string</code>                                                                                                                                                                                                                                                                                            |                                    | label for the dimension text, this will appear in the 2d view next to the dimension e.g. "width = "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| [param.common.value]     | <code>string</code> \| <code>real</code>                                                                                                                                                                                                                                                                       |                                    | value for the dimension text which will be concatenated with the label, if empty the value will be calculated automatically strings: - If a string is provided, "\<\>" can be used as a placeholder which will be replaced by the current value. - In angular dimensions, "\<\>" will be replaced by an angle value in degrees and °, e.g. "60°" - In radial dimensions, "\<\>" will be replaced by R and the radius value, e.g. "R60" - In diameter dimensions, "\<\>" will be replaced by Ø and the diameter value, e.g. "Ø120" special symbols: - "%%d" will be replaced by °. - "%%c" will be replaced by Ø |
| [param.common.color]     | <code>real</code>                                                                                                                                                                                                                                                                                              | <code>256</code>                   | color of the dimension (autocad color index) in range of [0,256], whereas 256 means the color will be taken from the defined layer in the dxf template                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| [param.common.layer]     | <code>string</code>                                                                                                                                                                                                                                                                                            | <code>&quot;1&quot;</code>         | layer where the dimension will appear, e.g. "1", depends on layer definitions in dxf template                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| param.common.textPos     | <code>point</code>                                                                                                                                                                                                                                                                                             |                                    | position where the dimension text (combination of label and value) will be placed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| [param.linear]           | <code>object</code>                                                                                                                                                                                                                                                                                            |                                    | object containing the parameters for a linear dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| param.linear.startPos    | <code>point</code>                                                                                                                                                                                                                                                                                             |                                    | position of the start of the linear dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| param.linear.endPos      | <code>point</code>                                                                                                                                                                                                                                                                                             |                                    | position of the end of the linear dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| [param.linear.textAngle] | <code>real</code>                                                                                                                                                                                                                                                                                              |                                    | If not set, it is calculated depending on orientation, which is OK for most cases. If angle (in radians) is set, it defines the dimension line orientation measured counter clockwise from the x-axis.                                                                                                                                                                                                                                                                                                                                                                                                          |
| param.linear.orientation | <code>&quot;VERTICAL&quot;</code> \| <code>&quot;HORIZONTAL&quot;</code> \| <code>&quot;ALIGNED&quot;</code>                                                                                                                                                                                                   |                                    | orientation of the linear dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| [param.angular]          | <code>object</code>                                                                                                                                                                                                                                                                                            |                                    | object containing the parameters for an angular dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| param.angular.startPos   | <code>point</code>                                                                                                                                                                                                                                                                                             |                                    | position of the start of the angular dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| param.angular.endPos     | <code>point</code>                                                                                                                                                                                                                                                                                             |                                    | position of the end of the angular dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| param.angular.cornerPos  | <code>point</code>                                                                                                                                                                                                                                                                                             |                                    | position of the corner of the angular dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| [param.angular.isCCW]    | <code>boolean</code>                                                                                                                                                                                                                                                                                           | <code>TRUE</code>                  | if true the orientation is counter clockwise (ccw) (default=TRUE)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| [param.radial]           | <code>object</code>                                                                                                                                                                                                                                                                                            |                                    | object containing the parameters for a radial dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| param.radial.centerPos   | <code>point</code>                                                                                                                                                                                                                                                                                             |                                    | position of the center of the radial dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| param.radial.radius      | <code>real</code>                                                                                                                                                                                                                                                                                              |                                    | radius of the radial dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| [param.diameter]         | <code>object</code>                                                                                                                                                                                                                                                                                            |                                    | object containing the parameters for a diameter dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| param.diameter.centerPos | <code>point</code>                                                                                                                                                                                                                                                                                             |                                    | position of the center of the diameter dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| param.diameter.radius    | <code>real</code>                                                                                                                                                                                                                                                                                              |                                    | radius of the diameter dimension                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

**Example**

```js
api.v1.drawing2d.dimension({ id: part, common: { type: 'LINEAR', textPos: [25, 20, 0] }, linear: { startPos: [0, 0, 0], endPos: [50, 0, 0], orientation: 'HORIZONTAL' }, viewType: 'FRONT' })
```

<a name="exportDXF"></a>

## exportDXF(param)

Exports all the views from given product into dxf. By default the model is written to a data string.

**Kind**: v1.drawing2d function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    success: boolean,
    content?: string  // content is the data of the export and is only available if neither file nor url is defined.
  }
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                        | Description                                                                                                     |
| ------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                         | object containing the parameters                                                                                |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code> | id of the product to export the views from                                                                      |
| [param.file]        | <code>string</code>                                         | full path of the file. Path has to be a for the ClassCAD process reachable local or UNC path.                   |
| [param.url]         | <code>string</code>                                         | url to send the model data to.                                                                                  |
| [param.encoding]    | <code>&quot;base64&quot;</code>                             | the encoding the data will be encoded with. If compression is also set, the decoding happens after compression! |
| [param.compression] | <code>&quot;deflate&quot;</code>                            | the compression algorithm the data is compressed with.                                                          |

**Example**

```js
api.v1.drawing2d.exportDXF({ id: part, file: '/var/models/file.dxf' })
api.v1.drawing2d.exportDXF({ id: part, compression: 'deflate', encoding: 'base64' })
```

<a name="exportSVG"></a>

## exportSVG(param)

Exports all the views from given product into svg. By default the model is written to a data string.

**Kind**: v1.drawing2d function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: {
    success: boolean,
    content?: string  // content is the data of the export and is only available if neither file nor url is defined.
  }
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param               | Type                                                                                         | Description                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| param               | <code>object</code>                                                                          | object containing the parameters                                                                                |
| param.id            | <code>string</code> \| <code>real</code> \| <code>id</code>                                  | id of the product to export the views from                                                                      |
| [param.file]        | <code>string</code>                                                                          | full path of the file. Path has to be a for the ClassCAD process reachable local or UNC path.                   |
| [param.url]         | <code>string</code>                                                                          | url to send the model data to.                                                                                  |
| [param.encoding]    | <code>&quot;base64&quot;</code>                                                              | the encoding the data will be encoded with. If compression is also set, the decoding happens after compression! |
| [param.compression] | <code>&quot;deflate&quot;</code>                                                             | the compression algorithm the data is compressed with.                                                          |
| [param.modus]       | <code>&quot;SVG_WHOLE_DRAWING&quot;</code> \| <code>&quot;SVG_FIT_WHOLE_DRAWING&quot;</code> | modus to define how drawing will fit into svg file                                                              |
| [param.renderSize]  | <code>object</code>                                                                          | object containing the render size of the drawing (default=1024x768)                                             |
| param.renderSize.x  | <code>real</code>                                                                            | horizontal size of the drawing                                                                                  |
| param.renderSize.y  | <code>real</code>                                                                            | vertical size of the drawing                                                                                    |

**Example**

```js
api.v1.drawing2d.exportSVG({ id: part, file: '/var/models/file.svg' })
api.v1.drawing2d.exportSVG({ id: part, compression: 'deflate', encoding: 'base64' })
```

<a name="getBoundaryBoxFromView"></a>

## getBoundaryBoxFromView(param)

This method returns min and max point for each given view.

**Kind**: v1.drawing2d function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: Array<{ min: point, max: point }> | VOID  // array of objects containing the min and max point
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param       | Type                                                                                                                                                                                                  | Description                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| param       | <code>object</code>                                                                                                                                                                                   | object containing the parameters                                                                        |
| param.id    | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                                           | id of the product to get boundary boxes of the views from                                               |
| param.types | <code>Array&lt;(&quot;TOP&quot;\|&quot;FRONT&quot;\|&quot;RIGHT&quot;\|&quot;LEFT&quot;\|&quot;BOTTOM&quot;\|&quot;RIGHT_90&quot;\|&quot;LEFT_90&quot;\|&quot;BACK&quot;\|&quot;ISO&quot;)&gt;</code> | type of views to get boundary box from, if empty, boundary boxes of all existing views will be returned |

**Example**

```js
api.v1.drawing2d.getBoundaryBoxFromView({ id: part, types: ['LEFT'] })
```

<a name="isDXFAvailable"></a>

## isDXFAvailable()

Returns true if DXF functionality is available, false if not.

**Kind**: v1.drawing2d function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: boolean // true if DXF functionality is available
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

**Example**

```js
api.v1.drawing2d.isDXFAvailable()
```

<a name="isSVGAvailable"></a>

## isSVGAvailable()

Returns true if SVG functionality is available, false if not.

**Kind**: v1.drawing2d function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: boolean // true if SVG functionality is available
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

**Example**

```js
api.v1.drawing2d.isSVGAvailable()
```

<a name="placeView"></a>

## placeView(param)

Places each view relatively to its current position in xy-plane

**Kind**: v1.drawing2d function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: VOID
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param                     | Type                                                                                                                                                                                                                                                                                                           | Description                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| param                     | <code>object</code>                                                                                                                                                                                                                                                                                            | object containing the parameters                              |
| param.id                  | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                                                                                                                                                    | id of the product to place the views                          |
| param.placements          | <code>Array&lt;object&gt;</code>                                                                                                                                                                                                                                                                               | objects containing the placement information                  |
| param.placements[].type   | <code>&quot;TOP&quot;</code> \| <code>&quot;FRONT&quot;</code> \| <code>&quot;RIGHT&quot;</code> \| <code>&quot;LEFT&quot;</code> \| <code>&quot;BOTTOM&quot;</code> \| <code>&quot;RIGHT_90&quot;</code> \| <code>&quot;LEFT_90&quot;</code> \| <code>&quot;BACK&quot;</code> \| <code>&quot;ISO&quot;</code> | type of view to place by offset vector                        |
| param.placements[].offset | <code>point</code>                                                                                                                                                                                                                                                                                             | offset vector to move view relatively to its current position |

**Example**

```js
api.v1.drawing2d.placeView({ id: part, placements: [{ type: 'TOP', offset: [0, 150, 0] }] })
```

<a name="updateDimensionPosition"></a>

## updateDimensionPosition(param)

Updates the position of the dimension text.
Attention: The view needs to be recreated to have updated positions in the view

**Kind**: v1.drawing2d function  
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
| param.pos | <code>point</code>                                          | position of the dimension text to update        |

**Example**

```js
api.v1.drawing2d.updateDimensionPosition({ id: dimension, pos: [50, 60, 0] })
```

<a name="view"></a>

## view(param)

Creates the defined 2d views of the given product (solids) in xy-plane and returns the ids of the created views.
Previously created dimensions will appear in the defined views (depends on type),
e.g. a dimension with viewType = "TOP", will appear in the "TOP" view

**Kind**: v1.drawing2d function  
**Returns**: <code>object</code> - object containing result and optional messages

```
{
  result: id|Array<id>  // one or multiple ids of the newly created views
  messages?: { message: string, level: real, code: real, api: string }[]
  maxLevel?: real
}
```

| Param         | Type                                                                                                                                                                                                  | Default                    | Description                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| param         | <code>object</code>                                                                                                                                                                                   |                            | object containing the parameters                                                                                                                              |
| param.id      | <code>string</code> \| <code>real</code> \| <code>id</code>                                                                                                                                           |                            | id of the product to create views of                                                                                                                          |
| param.types   | <code>Array&lt;(&quot;TOP&quot;\|&quot;FRONT&quot;\|&quot;RIGHT&quot;\|&quot;LEFT&quot;\|&quot;BOTTOM&quot;\|&quot;RIGHT_90&quot;\|&quot;LEFT_90&quot;\|&quot;BACK&quot;\|&quot;ISO&quot;)&gt;</code> |                            | type of views to create                                                                                                                                       |
| [param.color] | <code>real</code>                                                                                                                                                                                     | <code>0</code>             | color of the view (autocad color index) in range of [0,256], whereas 256 means the color will be taken from the defined layer in the dxf template (default=0) |
| [param.layer] | <code>string</code>                                                                                                                                                                                   | <code>&quot;0&quot;</code> | layer where the view will appear later in the dxf export, it depends on layer definitions in dxf template (default="0\*)                                      |

**Example**

```js
api.v1.drawing2d.view({ id: part, types: ['RIGHT', 'BOTTOM'], color: 125, layer: '5' })
```
