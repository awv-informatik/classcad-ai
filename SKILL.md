# ClassCAD API Skill

> **Source**: https://classcad.ch/docs/ · API version: **v1**

## Overview

ClassCAD is a **headless, programmable CAD engine** for building native, web-based, cloud-based, and automated CAD applications. It is **not** an end-user application — it is designed to be embedded into products, services, and workflows.

Client applications interact with ClassCAD **exclusively through public APIs and API wrappers**. All API calls follow the pattern:

```js
api.<version>.<domain>.<method>(param)
```

---

## Common

Cross-cutting references that apply across every domain. Read these first when starting any task — they describe the shared protocol and modeling primitives the per-domain APIs build on.

| Reference                                  | Topic                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| [SKETCHING.md](references/SKETCHING.md)    | 2D sketching primer: planes, profiles, constraints, regions, sketch-to-feature flow         |
| [STRUCTURE.md](references/STRUCTURE.md)    | Structure tree (SCG): node shape, traversal, parent chain, assembly transforms              |
| [GRAPHICS.md](references/GRAPHICS.md)      | Graphic protocol (SCG v9): containers, meshes, edges, arcs, materials, container types      |

---

## Domain Index

The v1 API (current version) is organized into **7 domains**. Click a domain name to jump to its API listing below. The "Reference" column links to the full API documentation for that domain.

| Domain                         | Namespace            | Reference                                   | Description                                                            |
| ------------------------------ | -------------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| [**1. Common**](#common)       | `api.v1.common.*`    | [common.md](references/api/common.md)       | Session management, load/save, settings, appearance, user data         |
| [**2. Part**](#part)           | `api.v1.part.*`      | [part.md](references/api/part.md)           | Feature-based part modeling (primitives, booleans, patterns, sketches) |
| [**3. Assembly**](#assembly)   | `api.v1.assembly.*`  | [assembly.md](references/api/assembly.md)   | Assembly building: templates, instances, constraints, patterns         |
| [**4. Sketch**](#sketch)       | `api.v1.sketch.*`    | [sketch.md](references/api/sketch.md)       | 2D constrained sketches on work planes                                 |
| [**5. Curve**](#curve)         | `api.v1.curve.*`     | [curve.md](references/api/curve.md)         | 2D/3D curve creation in shape containers                               |
| [**6. Solid**](#solid)         | `api.v1.solid.*`     | [solid.md](references/api/solid.md)         | Direct solid modeling within entity injection features                 |
| [**7. Drawing2D**](#drawing2d) | `api.v1.drawing2d.*` | [drawing2d.md](references/api/drawing2d.md) | 2D views, dimensions, DXF/SVG export                                   |

---

<a name="common"></a>

## 1. Common — 22 APIs

General-purpose utilities: file I/O, database settings, appearance, transformations, user data, batching, and recalculation.

| #   | API Name                    | Summary                                                                | Source                          |
| --- | --------------------------- | ---------------------------------------------------------------------- | ------------------------------- |
| 1   | `clear`                     | Deletes all objects in the current drawing                             | [api](references/api/common.md) |
| 2   | `evaluateExpression`        | Evaluates an expression                                                | [api](references/api/common.md) |
| 3   | `getDatabaseSettings`       | Returns the current general settings from the database                 | [api](references/api/common.md) |
| 4   | `getFacetingParameters`     | Returns the faceting parameters used to tessellate surfaces and curves | [api](references/api/common.md) |
| 5   | `setAppearance`             | Sets the appearance on the target (color, transparency, faceting)      | [api](references/api/common.md) |
| 6   | `setDatabaseSettings`       | Sets the current and initial general settings on the database          | [api](references/api/common.md) |
| 7   | `setFacetingParameters`     | Sets the faceting parameters of current drawing                        | [api](references/api/common.md) |
| 8   | `transformObjectWithMatrix` | Transforms an object with the given 4x4 matrix                         | [api](references/api/common.md) |
| 9   | `setObjectCoordSystem`      | Sets the coordinate system on an object                                | [api](references/api/common.md) |
| 10  | `setObjectName`             | Sets the name on an object                                             | [api](references/api/common.md) |
| 11  | `getClassFileVersion`       | Returns the class file version                                         | [api](references/api/common.md) |
| 12  | `getAppVersion`             | Returns the app version                                                | [api](references/api/common.md) |
| 13  | `setUserData`               | Sets custom user data by key and value on given object                 | [api](references/api/common.md) |
| 14  | `getUserData`               | Returns the value from the user data map at given key                  | [api](references/api/common.md) |
| 15  | `removeUserData`            | Removes the user data entry identified by given key                    | [api](references/api/common.md) |
| 16  | `clearUserData`             | Clears all entries from user data of given object                      | [api](references/api/common.md) |
| 17  | `getUserDataKeys`           | Returns all the keys of user data map of given object                  | [api](references/api/common.md) |
| 18  | `batch`                     | Runs the given API calls in a sequence                                 | [api](references/api/common.md) |
| 19  | `requestVisualisation`      | Requests the visualisation of entities/cad entities from the server    | [api](references/api/common.md) |
| 20  | `load`                      | Reads drawing from ClassCAD- or SolidFile (OFB, STP, IWP, STL)         | [api](references/api/common.md) |
| 21  | `save`                      | Stores the current model (OFB, SCG, STP, IWP, STL, DXF)                | [api](references/api/common.md) |
| 22  | `recalc`                    | Recalculates and updates the whole drawing with all its objects        | [api](references/api/common.md) |

---

<a name="part"></a>

## 2. Part — 76 APIs

Part modeling: feature creation/update (box, cone, cylinder, sphere, extrusion, revolve, twist, slice, boolean, chamfer, fillet, mirror, patterns), work geometry, expressions, sketches, entity injection, and feature operations.

| #   | API Name                     | Summary                                                                   | Source                        |
| --- | ---------------------------- | ------------------------------------------------------------------------- | ----------------------------- |
| 1   | `create`                     | Clears the drawing and creates a new part                                 | [api](references/api/part.md) |
| 2   | `box`                        | Creates a box feature                                                     | [api](references/api/part.md) |
| 3   | `updateBox`                  | Updates a box feature                                                     | [api](references/api/part.md) |
| 4   | `cone`                       | Creates a cone feature                                                    | [api](references/api/part.md) |
| 5   | `updateCone`                 | Updates a cone feature                                                    | [api](references/api/part.md) |
| 6   | `cylinder`                   | Creates a cylinder feature                                                | [api](references/api/part.md) |
| 7   | `updateCylinder`             | Updates a cylinder feature                                                | [api](references/api/part.md) |
| 8   | `sphere`                     | Creates a sphere feature                                                  | [api](references/api/part.md) |
| 9   | `updateSphere`               | Updates a sphere feature                                                  | [api](references/api/part.md) |
| 10  | `extrusion`                  | Creates an extrusion feature                                              | [api](references/api/part.md) |
| 11  | `updateExtrusion`            | Updates an extrusion feature                                              | [api](references/api/part.md) |
| 12  | `revolve`                    | Creates a revolve feature                                                 | [api](references/api/part.md) |
| 13  | `updateRevolve`              | Updates a revolve feature                                                 | [api](references/api/part.md) |
| 14  | `twist`                      | Creates a twist feature                                                   | [api](references/api/part.md) |
| 15  | `updateTwist`                | Updates a twist feature                                                   | [api](references/api/part.md) |
| 16  | `mirror`                     | Creates a mirror feature                                                  | [api](references/api/part.md) |
| 17  | `updateMirror`               | Updates a mirror feature                                                  | [api](references/api/part.md) |
| 18  | `boolean`                    | Creates a boolean feature                                                 | [api](references/api/part.md) |
| 19  | `updateBoolean`              | Updates a boolean feature                                                 | [api](references/api/part.md) |
| 20  | `slice`                      | Creates a slice feature                                                   | [api](references/api/part.md) |
| 21  | `updateSlice`                | Updates a slice feature                                                   | [api](references/api/part.md) |
| 22  | `sliceBySheet`               | Creates a slice by sheet feature                                          | [api](references/api/part.md) |
| 23  | `updateSliceBySheet`         | Updates a slice by sheet feature                                          | [api](references/api/part.md) |
| 24  | `chamfer`                    | Creates a chamfer feature                                                 | [api](references/api/part.md) |
| 25  | `updateChamfer`              | Updates a chamfer feature                                                 | [api](references/api/part.md) |
| 26  | `fillet`                     | Creates a fillet feature                                                  | [api](references/api/part.md) |
| 27  | `updateFillet`               | Updates a fillet feature                                                  | [api](references/api/part.md) |
| 28  | `linearPattern`              | Creates a linear pattern feature                                          | [api](references/api/part.md) |
| 29  | `updateLinearPattern`        | Updates a linear pattern feature                                          | [api](references/api/part.md) |
| 30  | `circularPattern`            | Creates a circular pattern feature                                        | [api](references/api/part.md) |
| 31  | `updateCircularPattern`      | Updates a circular pattern feature                                        | [api](references/api/part.md) |
| 32  | `translation`                | Creates a translation feature                                             | [api](references/api/part.md) |
| 33  | `updateTranslation`          | Updates a translation feature                                             | [api](references/api/part.md) |
| 34  | `rotation`                   | Creates a rotation feature                                                | [api](references/api/part.md) |
| 35  | `updateRotation`             | Updates a rotation feature                                                | [api](references/api/part.md) |
| 36  | `transformationByCSys`       | Creates a transformation by coordinate system feature                     | [api](references/api/part.md) |
| 37  | `updateTransformationByCSys` | Updates a transformation by coordinate system feature                     | [api](references/api/part.md) |
| 38  | `entityDeletion`             | Creates an entity deletion feature                                        | [api](references/api/part.md) |
| 39  | `updateEntityDeletion`       | Updates an existing entity deletion feature                               | [api](references/api/part.md) |
| 40  | `importFeature`              | Creates an import feature                                                 | [api](references/api/part.md) |
| 41  | `updateImportFeature`        | Updates an import feature                                                 | [api](references/api/part.md) |
| 42  | `entityInjection`            | Creates a new entity injection                                            | [api](references/api/part.md) |
| 43  | `workCSys`                   | Creates a work coordinate system feature                                  | [api](references/api/part.md) |
| 44  | `updateWorkCSys`             | Updates a work coordinate system feature                                  | [api](references/api/part.md) |
| 45  | `workPlane`                  | Creates a work plane feature                                              | [api](references/api/part.md) |
| 46  | `updateWorkPlane`            | Updates a work plane feature                                              | [api](references/api/part.md) |
| 47  | `workAxis`                   | Creates a work axis feature                                               | [api](references/api/part.md) |
| 48  | `updateWorkAxis`             | Updates a work axis feature                                               | [api](references/api/part.md) |
| 49  | `workPoint`                  | Creates a work point feature                                              | [api](references/api/part.md) |
| 50  | `updateWorkPoint`            | Updates a work point feature                                              | [api](references/api/part.md) |
| 51  | `compositeCurve`             | Creates a composite curve feature                                         | [api](references/api/part.md) |
| 52  | `updateCompositeCurve`       | Updates a composite curve feature                                         | [api](references/api/part.md) |
| 53  | `sketch`                     | Creates a new sketch and places it optionally on a face or work plane     | [api](references/api/part.md) |
| 54  | `setAppearance`              | Sets the appearance on the target feature (color, transparency, faceting) | [api](references/api/part.md) |
| 55  | `expression`                 | Creates expressions in different products                                 | [api](references/api/part.md) |
| 56  | `getExpression`              | Returns the value and the expression                                      | [api](references/api/part.md) |
| 57  | `updateExpression`           | Updates existing expressions in different products                        | [api](references/api/part.md) |
| 58  | `deleteExpression`           | Deletes expressions in different products                                 | [api](references/api/part.md) |
| 59  | `renameExpression`           | Renames expressions in different products                                 | [api](references/api/part.md) |
| 60  | `linkWithExpression`         | Connects an expression with a dimensional constraint or feature parameter | [api](references/api/part.md) |
| 61  | `unlinkExpression`           | Unlinks expression from dimensional constraints or feature parameters     | [api](references/api/part.md) |
| 62  | `getFeature`                 | Returns the id of the feature with the given name                         | [api](references/api/part.md) |
| 63  | `getSketch`                  | Returns the id of the sketch with the given name                          | [api](references/api/part.md) |
| 64  | `getSketchRegion`            | Returns the id of the sketch region with the given name                   | [api](references/api/part.md) |
| 65  | `getWorkGeometry`            | Returns the id of the work geometry object with the given name            | [api](references/api/part.md) |
| 66  | `getGeometryIds`             | Returns the geometry (brep element) which best fits the given points      | [api](references/api/part.md) |
| 67  | `getGeometryPositions`       | Returns the positions uniquely identifying the geometries (brep elements) | [api](references/api/part.md) |
| 68  | `getBrepGeometryIndex`       | Returns an index of a brep element within its brep container              | [api](references/api/part.md) |
| 69  | `getBrepGeometryByIndex`     | Returns a brep element within the given brep container by its index       | [api](references/api/part.md) |
| 70  | `openFeature`                | Moves GhostRollbackBar to the position before passed feature              | [api](references/api/part.md) |
| 71  | `closeFeature`               | Moves GhostRollbackBar back to RollbackBar, restores visibility           | [api](references/api/part.md) |
| 72  | `operationMoveBefore`        | Moves the rollback bar to the position right before the provided feature  | [api](references/api/part.md) |
| 73  | `operationMoveToEnd`         | Moves the rollback bar to the latest feature                              | [api](references/api/part.md) |
| 74  | `deleteFeature`              | Deletes existing features, work geometries and sketches                   | [api](references/api/part.md) |
| 75  | `calculateMassProperties`    | Calculates center of gravity and volume of the given object               | [api](references/api/part.md) |
| 76  | `createUncommitedObject`     | Creates a new uncommited (empty) feature in the given part                | [api](references/api/part.md) |

---

<a name="assembly"></a>

## 3. Assembly — 62 APIs

Assembly management: root assembly creation, templates, instances, constraints (fastened, revolute, cylindrical, planar, parallel, slider, spherical, gear, group), patterns, transformations, and constraint-driven motion.

| #   | API Name                       | Summary                                                                  | Source                            |
| --- | ------------------------------ | ------------------------------------------------------------------------ | --------------------------------- |
| 1   | `create`                       | Creates a new root assembly                                              | [api](references/api/assembly.md) |
| 2   | `partTemplate`                 | Creates a new part and adds it as template to the product container      | [api](references/api/assembly.md) |
| 3   | `assemblyTemplate`             | Creates a new assembly and adds it as template to the product container  | [api](references/api/assembly.md) |
| 4   | `getPartTemplate`              | Returns the part template with given name from part container            | [api](references/api/assembly.md) |
| 5   | `getAssemblyTemplate`          | Returns the assembly template with given name from assembly container    | [api](references/api/assembly.md) |
| 6   | `deleteTemplate`               | Deletes a part or assembly template                                      | [api](references/api/assembly.md) |
| 7   | `convertToTemplate`            | Converts the current root assembly into an assembly template             | [api](references/api/assembly.md) |
| 8   | `instance`                     | Creates instances of products and adds them to root assembly or template | [api](references/api/assembly.md) |
| 9   | `getInstance`                  | Returns a single, multiple or all instances of an owner                  | [api](references/api/assembly.md) |
| 10  | `deleteInstance`               | Deletes instances from root assembly, other instances or templates       | [api](references/api/assembly.md) |
| 11  | `from`                         | Creates an assembly from a JSON-defined assembly or ECXML definition     | [api](references/api/assembly.md) |
| 12  | `loadProduct`                  | Loads a product from file, data or url                                   | [api](references/api/assembly.md) |
| 13  | `exportNode`                   | Exports a node from the assembly tree or a template from containers      | [api](references/api/assembly.md) |
| 14  | `fastened`                     | Creates a new fastened constraint                                        | [api](references/api/assembly.md) |
| 15  | `updateFastened`               | Updates an existing fastened constraint                                  | [api](references/api/assembly.md) |
| 16  | `getFastened`                  | Returns the fastened constraint of given reference                       | [api](references/api/assembly.md) |
| 17  | `fastenedOrigin`               | Creates a new fastened origin constraint                                 | [api](references/api/assembly.md) |
| 18  | `updateFastenedOrigin`         | Updates an existing fastened origin constraint                           | [api](references/api/assembly.md) |
| 19  | `getFastenedOrigin`            | Returns the fastened origin constraint of given reference                | [api](references/api/assembly.md) |
| 20  | `revolute`                     | Creates a new revolute constraint                                        | [api](references/api/assembly.md) |
| 21  | `updateRevolute`               | Updates a revolute constraint                                            | [api](references/api/assembly.md) |
| 22  | `getRevolute`                  | Returns the revolute constraint of given reference                       | [api](references/api/assembly.md) |
| 23  | `cylindrical`                  | Creates a new cylindrical constraint                                     | [api](references/api/assembly.md) |
| 24  | `updateCylindrical`            | Updates an existing cylindrical constraint                               | [api](references/api/assembly.md) |
| 25  | `getCylindrical`               | Returns the cylindrical constraint of given reference                    | [api](references/api/assembly.md) |
| 26  | `parallel`                     | Creates a new parallel constraint                                        | [api](references/api/assembly.md) |
| 27  | `updateParallel`               | Updates an existing parallel constraint                                  | [api](references/api/assembly.md) |
| 28  | `getParallel`                  | Returns the parallel constraint of given reference                       | [api](references/api/assembly.md) |
| 29  | `planar`                       | Creates a new planar constraint                                          | [api](references/api/assembly.md) |
| 30  | `updatePlanar`                 | Updates an existing planar constraint                                    | [api](references/api/assembly.md) |
| 31  | `getPlanar`                    | Returns the planar constraint of given reference                         | [api](references/api/assembly.md) |
| 32  | `slider`                       | Creates a new slider constraint                                          | [api](references/api/assembly.md) |
| 33  | `updateSlider`                 | Updates an existing slider constraint                                    | [api](references/api/assembly.md) |
| 34  | `getSlider`                    | Returns the slider constraint of given reference                         | [api](references/api/assembly.md) |
| 35  | `spherical`                    | Creates a new spherical constraint                                       | [api](references/api/assembly.md) |
| 36  | `updateSpherical`              | Updates an existing spherical constraint                                 | [api](references/api/assembly.md) |
| 37  | `getSpherical`                 | Returns the spherical constraint of given reference                      | [api](references/api/assembly.md) |
| 38  | `gear`                         | Creates a new gear relation                                              | [api](references/api/assembly.md) |
| 39  | `updateGear`                   | Updates an existing gear relation                                        | [api](references/api/assembly.md) |
| 40  | `getGear`                      | Returns the gear relation of given reference                             | [api](references/api/assembly.md) |
| 41  | `group`                        | Creates a new group constraint                                           | [api](references/api/assembly.md) |
| 42  | `updateGroup`                  | Updates an existing group constraint                                     | [api](references/api/assembly.md) |
| 43  | `getGroup`                     | Returns the group constraint of given reference                          | [api](references/api/assembly.md) |
| 44  | `deleteConstraint`             | Deletes constraints/relations from assemblies                            | [api](references/api/assembly.md) |
| 45  | `update3DConstraintValue`      | Updates multiple limited values of constraints                           | [api](references/api/assembly.md) |
| 46  | `linearPattern`                | Creates a new linear pattern constraint                                  | [api](references/api/assembly.md) |
| 47  | `updateLinearPattern`          | Updates an existing linear pattern constraint                            | [api](references/api/assembly.md) |
| 48  | `getLinearPattern`             | Returns the linear pattern constraint of given reference                 | [api](references/api/assembly.md) |
| 49  | `circularPattern`              | Creates a new circular pattern constraint                                | [api](references/api/assembly.md) |
| 50  | `updateCircularPattern`        | Updates an existing circular pattern constraint                          | [api](references/api/assembly.md) |
| 51  | `getCircularPattern`           | Returns the circular pattern constraint of given reference               | [api](references/api/assembly.md) |
| 52  | `transformInstance`            | Transforms instances by the given transformation                         | [api](references/api/assembly.md) |
| 53  | `transformInstanceTo`          | Transforms instances to a given absolute transformation                  | [api](references/api/assembly.md) |
| 54  | `startMovingUnderConstraints`  | Prepares to move constrained objects                                     | [api](references/api/assembly.md) |
| 55  | `moveUnderConstraints`         | Attempts to move constrained objects                                     | [api](references/api/assembly.md) |
| 56  | `finishMovingUnderConstraints` | Finishes moving the constrained objects                                  | [api](references/api/assembly.md) |
| 57  | `setCurrentInstance`           | Sets the given instance or root assembly as the current                  | [api](references/api/assembly.md) |
| 58  | `setCurrentProduct`            | Sets the current product                                                 | [api](references/api/assembly.md) |
| 59  | `setIdent`                     | Sets a string identifier for an existing object                          | [api](references/api/assembly.md) |
| 60  | `getWorkGeometry`              | Returns the id of a work geometry object from an assembly or instance    | [api](references/api/assembly.md) |
| 61  | `calculateMassProperties`      | Calculates center of gravity and volume of the given object              | [api](references/api/assembly.md) |
| 62  | `createUncommitedObject`       | Creates a new uncommited object (use with clear intention only)          | [api](references/api/assembly.md) |

---

<a name="sketch"></a>

## 4. Sketch — 41 APIs

2D sketch creation and editing: geometry (points, lines, arcs, circles, rectangles), constraints, dimensions, sketch regions, patterns (linear, circular, mirror), reference geometry, rigid sets, fillets, trimming, splitting, and geometry queries.

| #   | API Name                  | Summary                                                               | Source                          |
| --- | ------------------------- | --------------------------------------------------------------------- | ------------------------------- |
| 1   | `create`                  | Creates a new sketch and places it optionally on a face or work plane | [api](references/api/sketch.md) |
| 2   | `setWorkPlane`            | Sets workplane for the sketch                                         | [api](references/api/sketch.md) |
| 3   | `point`                   | Creates one or multiple points in the sketch                          | [api](references/api/sketch.md) |
| 4   | `line`                    | Creates one or multiple lines in the sketch                           | [api](references/api/sketch.md) |
| 5   | `circle`                  | Creates one or multiple circles in the sketch                         | [api](references/api/sketch.md) |
| 6   | `arcByCenter`             | Creates one or multiple arcs by center in the sketch                  | [api](references/api/sketch.md) |
| 7   | `arcBy3Points`            | Creates one or multiple arcs by 3 points in the sketch                | [api](references/api/sketch.md) |
| 8   | `rectangle`               | Creates a rectangle formed by two positions                           | [api](references/api/sketch.md) |
| 9   | `geometry`                | Creates one or multiple sketch geometry in the sketch                 | [api](references/api/sketch.md) |
| 10  | `constraint`              | Creates one or multiple constraints in the sketch                     | [api](references/api/sketch.md) |
| 11  | `dimension`               | Creates one or multiple dimensional constraints in the sketch         | [api](references/api/sketch.md) |
| 12  | `updateDimension`         | Updates the dimension of sketch geometry and recalculates             | [api](references/api/sketch.md) |
| 13  | `updateDimensionPosition` | Updates the position of the dimension text                            | [api](references/api/sketch.md) |
| 14  | `updateGeometry`          | Updates the sketch geometry                                           | [api](references/api/sketch.md) |
| 15  | `sketchRegion`            | Creates a sketch region for a given sketch from sketch geometry       | [api](references/api/sketch.md) |
| 16  | `updateSketchRegion`      | Updates sketch regions with new sketch geometry                       | [api](references/api/sketch.md) |
| 17  | `getSketchRegion`         | Returns the id of the sketch region with the given name               | [api](references/api/sketch.md) |
| 18  | `referenceGeometry`       | Creates new "Use"-Geometry in sketch                                  | [api](references/api/sketch.md) |
| 19  | `changeReferenceGeometry` | Re-links "Use"-Geometry to another reference                          | [api](references/api/sketch.md) |
| 20  | `unlinkReferenceGeometry` | Unlinks "Use"-Geometry (keeps geometry, removes reference link)       | [api](references/api/sketch.md) |
| 21  | `setReferences`           | Creates and sets the plane, axis and origin reference of the sketch   | [api](references/api/sketch.md) |
| 22  | `rigidSet`                | Creates a rigid set from given sketch geometry                        | [api](references/api/sketch.md) |
| 23  | `linearPattern`           | Patterns a rigidset or single object in linear/rectangular order      | [api](references/api/sketch.md) |
| 24  | `circularPattern`         | Patterns a rigidset or single object in circular order                | [api](references/api/sketch.md) |
| 25  | `mirrorPattern`           | Patterns a rigidset or single object in mirror order                  | [api](references/api/sketch.md) |
| 26  | `copyGeometry`            | Copies sketch geometry                                                | [api](references/api/sketch.md) |
| 27  | `copyFrom`                | Copies the sketch geometry from one sketch to another                 | [api](references/api/sketch.md) |
| 28  | `moveGeometry`            | Moves the given sketch geometry by translation vector                 | [api](references/api/sketch.md) |
| 29  | `fillet`                  | Creates a fillet in place of a point and its two connecting lines     | [api](references/api/sketch.md) |
| 30  | `undoFillet`              | Deletes an existing fillet by removing the arc and reconnecting lines | [api](references/api/sketch.md) |
| 31  | `trimCurves`              | Trims away curves if they are suitable for trimming                   | [api](references/api/sketch.md) |
| 32  | `splitAllCurves`          | Splits all curves in the given sketch                                 | [api](references/api/sketch.md) |
| 33  | `splitCurves`             | Splits curves in specified parameterized positions                    | [api](references/api/sketch.md) |
| 34  | `splitCurvesMergeBack`    | Merges the splitted curves back                                       | [api](references/api/sketch.md) |
| 35  | `generateAutoConstraints` | Automatically generates constraints where sensible without redundancy | [api](references/api/sketch.md) |
| 36  | `loadFrom`                | Loads an OFB file and copies sketch geometry to an existing sketch    | [api](references/api/sketch.md) |
| 37  | `getGeometry`             | Gets all sketch geometry from a sketch, region or rigid set           | [api](references/api/sketch.md) |
| 38  | `getPoints`               | Gets the specific point ids of lines, arcs or circles                 | [api](references/api/sketch.md) |
| 39  | `getPositions`            | Gets the specific positions of points, lines, arcs or circles         | [api](references/api/sketch.md) |
| 40  | `deleteObject`            | Deletes dimensions, constraints, geometry, regions or rigid sets      | [api](references/api/sketch.md) |
| 41  | `deleteSketch`            | Deletes existing sketches                                             | [api](references/api/sketch.md) |

---

<a name="curve"></a>

## 5. Curve — 21 APIs

Low-level 3D curve creation in shape containers: lines, arcs, circles, ellipses, Bezier curves, interpolation curves, polylines, advanced polylines (with fillets/chamfers), and 2D boolean operations on shapes.

| #   | API Name              | Summary                                                                                 | Source                         |
| --- | --------------------- | --------------------------------------------------------------------------------------- | ------------------------------ |
| 1   | `shape`               | Creates a shape container in an entity injection feature                                | [api](references/api/curve.md) |
| 2   | `deleteShape`         | Deletes shapes                                                                          | [api](references/api/curve.md) |
| 3   | `cleanShape`          | Cleans shapes (deletes curves but keeps the shape container)                            | [api](references/api/curve.md) |
| 4   | `line`                | Creates one or multiple lines in a shape container                                      | [api](references/api/curve.md) |
| 5   | `circle`              | Creates one or multiple circles in a shape container                                    | [api](references/api/curve.md) |
| 6   | `arcBy3Points`        | Creates arcs defined by start, end and mid point                                        | [api](references/api/curve.md) |
| 7   | `arcByCenterRadAngle` | Creates arcs defined by center, radius and angle                                        | [api](references/api/curve.md) |
| 8   | `arcByCenter`         | Creates arcs defined by start, end and center point                                     | [api](references/api/curve.md) |
| 9   | `ellipse`             | Creates one or multiple ellipse curves                                                  | [api](references/api/curve.md) |
| 10  | `ellipticArc`         | Creates one or multiple elliptic arc curves                                             | [api](references/api/curve.md) |
| 11  | `bezierCurve`         | Creates BezierCurves of degree n (number of points - 1)                                 | [api](references/api/curve.md) |
| 12  | `interpolationCurve`  | Creates an interpolation curve through given array of points                            | [api](references/api/curve.md) |
| 13  | `polyline2d`          | Creates entity array of lines and arcs from polyline definition with points and bulges  | [api](references/api/curve.md) |
| 14  | `advancedPolyline`    | Creates an advanced polyline using point-line definitions (with radius/chamfer support) | [api](references/api/curve.md) |
| 15  | `translateShape`      | Translates a shape by the given vector                                                  | [api](references/api/curve.md) |
| 16  | `rotateShape`         | Rotates a shape by the given rotation vector                                            | [api](references/api/curve.md) |
| 17  | `transformShape`      | Transforms a shape with a 4x4 transformation matrix                                     | [api](references/api/curve.md) |
| 18  | `scaleShape`          | Scales a shape with a factor                                                            | [api](references/api/curve.md) |
| 19  | `union2d`             | Creates a union between two shapes                                                      | [api](references/api/curve.md) |
| 20  | `subtraction2d`       | Creates a subtraction between two shapes                                                | [api](references/api/curve.md) |
| 21  | `intersection2d`      | Creates an intersection between two shapes                                              | [api](references/api/curve.md) |

---

<a name="solid"></a>

## 6. Solid — 21 APIs

Direct solid body operations within entity injection features: primitive creation (box, sphere, cylinder, cone), extrusion, revolve, boolean operations (union, subtraction, intersection, merge), transformations (translation, rotation, scale, mirror, offset, slice, section), copy, fillet, and cross-feature solid access.

| #   | API Name       | Summary                                                                | Source                         |
| --- | -------------- | ---------------------------------------------------------------------- | ------------------------------ |
| 1   | `box`          | Creates a box solid                                                    | [api](references/api/solid.md) |
| 2   | `sphere`       | Creates a sphere solid                                                 | [api](references/api/solid.md) |
| 3   | `cylinder`     | Creates a cylinder solid                                               | [api](references/api/solid.md) |
| 4   | `cone`         | Creates a cone solid                                                   | [api](references/api/solid.md) |
| 5   | `extrusion`    | Creates an extrusion by extruding a shape or sketch geometry           | [api](references/api/solid.md) |
| 6   | `revolve`      | Creates a revolve by revolving a polyline                              | [api](references/api/solid.md) |
| 7   | `copy`         | Creates a copy of the given solid                                      | [api](references/api/solid.md) |
| 8   | `deleteSolid`  | Deletes the given solids or all solids                                 | [api](references/api/solid.md) |
| 9   | `union`        | Creates a union between solids                                         | [api](references/api/solid.md) |
| 10  | `subtraction`  | Creates a subtraction between solids                                   | [api](references/api/solid.md) |
| 11  | `intersection` | Creates an intersection between solids                                 | [api](references/api/solid.md) |
| 12  | `merge`        | Creates a merge between solids (NOT a union)                           | [api](references/api/solid.md) |
| 13  | `mirror`       | Mirrors the given solid at defined plane                               | [api](references/api/solid.md) |
| 14  | `translation`  | Translates the given solid by a vector                                 | [api](references/api/solid.md) |
| 15  | `rotation`     | Rotates the given solid by a rotation vector                           | [api](references/api/solid.md) |
| 16  | `scale`        | Scales the given solid with a factor                                   | [api](references/api/solid.md) |
| 17  | `offset`       | Creates an offset solid of the given solid                             | [api](references/api/solid.md) |
| 18  | `slice`        | Cuts the given solid at defined plane                                  | [api](references/api/solid.md) |
| 19  | `section`      | Sections the given solid at the given plane                            | [api](references/api/solid.md) |
| 20  | `fillet`       | Creates a fillet at the given edges                                    | [api](references/api/solid.md) |
| 21  | `useSolid`     | Accesses solids from other features for use within an entity injection | [api](references/api/solid.md) |

---

<a name="drawing2d"></a>

## 7. Drawing2D — 11 APIs

2D technical drawing: view creation and placement, dimensioning, boundary boxes, and export to DXF/SVG formats.

| #   | API Name                  | Summary                                                             | Source                             |
| --- | ------------------------- | ------------------------------------------------------------------- | ---------------------------------- |
| 1   | `view`                    | Creates 2D views of the given product (solids) in xy-plane          | [api](references/api/drawing2d.md) |
| 2   | `centerView`              | Centers all given views to origin based on each view's boundary box | [api](references/api/drawing2d.md) |
| 3   | `placeView`               | Places each view relatively to its current position in xy-plane     | [api](references/api/drawing2d.md) |
| 4   | `getBoundaryBoxFromView`  | Returns min and max point for each given view                       | [api](references/api/drawing2d.md) |
| 5   | `dimension`               | Creates one or multiple dimensions in the product                   | [api](references/api/drawing2d.md) |
| 6   | `deleteDimension`         | Deletes one or multiple dimensions of the 2D view                   | [api](references/api/drawing2d.md) |
| 7   | `updateDimensionPosition` | Updates the position of the dimension text                          | [api](references/api/drawing2d.md) |
| 8   | `exportDXF`               | Exports all the views from given product into DXF                   | [api](references/api/drawing2d.md) |
| 9   | `exportSVG`               | Exports all the views from given product into SVG                   | [api](references/api/drawing2d.md) |
| 10  | `isDXFAvailable`          | Returns true if DXF functionality is available                      | [api](references/api/drawing2d.md) |
| 11  | `isSVGAvailable`          | Returns true if SVG functionality is available                      | [api](references/api/drawing2d.md) |

---

## Guides

Practical workflow guides for complex multi-API tasks.

| Guide | Description | Reference |
|-------|-------------|-----------|
| **Sketching** | Reproducing technical drawings: dimension analysis, circle-based construction, trim workflow, constraint placement, iterative evaluation | [SKETCHING.md](references/SKETCHING.md) |
