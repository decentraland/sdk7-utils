# @dcl-sdk/utils

This library includes a number of helpful pre-built tools that offer simple solutions to common scenarios that you're likely to run into.

- [Debug helpers](#debug-helpers)
  - [Label](#label)
  - [Cube](#cube)
- [Tweens](#tweens)
  - [Translate an entity](#translate-an-entity)
  - [Rotate an entity](#rotate-an-entity)
  - [Scale an entity](#scale-an-entity)
  - [Non-linear changes](#non-linear-changes)
  - [Stopping tweens and callbacks](#stopping-tweens-and-callbacks)
- [Perpetual motions](#perpetual-motions)
  - [Perpetual rotation](#perpetual-rotation)
- [Path following](#path-following)
  - [Straight path](#straight-path)
  - [Smooth path](#smooth-path)
  - [Stopping paths and callbacks](#stopping-paths-and-callbacks)
- [Toggle](#toggle)
- [Timers](#time)
  - [Delay a function](#delay-a-function)
  - [Repeat at an interval](#repeat-at-an-interval)
  - [Canceling execution](#canceling-execution)
- [Triggers](#triggers)
  - [Create a trigger](#create-a-trigger)
  - [Disable a trigger](#disable-a-trigger)
  - [One time trigger](#one-time-trigger)
  - [Trigger layers](#trigger-layers)
- [Math](#math)
  - [Remap](#remap)
  - [World position](#world-position)
  - [World rotation](#world-rotation)
- [Other helpers](#other-helpers)
  - [Get entity parent](#get-entity-parent)
  - [Get entities with parent](#get-entities-with-parent)
  - [Get player position](#get-player-position)
  - [Play sound](#play-sound)
- [Action sequence](#action-sequence)
  - [IAction](#iaction)
  - [Sequence builder](#sequence-builder)
  - [Sequence runner](#sequence-runner)
  - [Full example](#full-example)

## Using the Utils library

To use any of the helpers provided by the utils library you must install it in your Decentrland project.

### Via the Decentraland Editor

Make sure you've [installed the Decentraland editor](https://docs.decentraland.org/creator/development-guide/sdk7/installation-guide/#the-decentraland-editor).

1. Open your scene's folder using Visual Studio Code.

> **📔 Note**: The Visual Studio window must be at the root folder of the scene project.

2. Open the Decentraland Editor tab on Visual Studio. Note that the bottom section lists all of your project's currently installed dependencies.

3. Click the `+` icon on the header of the **Dependencies** view.

4. Visual Studio opens an input box at the top of the screen. Write `@dcl-sdk/utils` and hit enter. The dependency is then installed to your scene.

5. Import the library into the scene's script. Add this line at the start of TypeScript files that require it:

```ts
import * as utils from '@dcl-sdk/utils'
```

6. In your TypeScript file, write `utils.` and let the suggestions of your IDE show the available helpers.

### Via the CLI

1. Install it as an `npm` package. Run this command in your scene's project folder:

```
npm install @dcl-sdk/utils
```

2. Run `dcl start` or `dcl build` so the dependencies are correctly installed.

3. Import the library into the scene's script. Add this line at the start of TypeScript files that require it:

```ts
import * as utils from '@dcl-sdk/utils'
```

4. In your TypeScript file, write `utils.` and let the suggestions of your IDE show the available helpers.

## Debug helpers

### Label

Add a text label floating over an entity using `utils.addLabel`. It has two required arguments:

- `text`: The string of text to display.
- `parent`: The entity to set the label on.

```ts
export * from '@dcl/sdk'
import * as utils from '@dcl-sdk/utils'

const cube = utils.addTestCube({ position: { x: 1, y: 1, z: 1 } })
utils.addLabel('Random cube', cube)
```

`utils.addLabel` also lets you set the following:

- `billboard`: If true, label turns to always face player. True by default.
- `color`: Text color. Black by default.
- `size`: Text font size, 3 by default.
- `textOffset`: Offset from parent entity's position. By default 1.5 meters above the parent.

> Tip: `utils.addLabel` returns the created entity used for the text. You can then tweak this entity in any way you choose.

### Debug cube

Render a simple clickable cube to use as a trigger when debugging a scene with `utils.addTestCube`. It has two required arguments:

- `transform`: The position, rotation and/or scale of the cube, expressed as a `TransformType` object, as gets passed when creating a `Transform` component.
- `triggeredFunction`: A function that gets called every time the cube is clicked.

```ts
export * from '@dcl/sdk'
import * as utils from '@dcl-sdk/utils'

utils.addTestCube({ position: { x: 2, y: 1, z: 2 } }, (event) => {
	console.log('Cube clicked')
})
```

`utils.addTestCube` also lets you set the following:

- `label`: An optional label to display floating over the cube.
- `color`: A color for the cube's material.
- `sphere`: If true, it renders as a Sphere instead of a cube.
- `noCollider`: If true, the cube won't have a collider and will let players walk through it.

> Tip: `utils.addTestCube` returns the created entity for the cube. You can then tweak this entity in any way you choose.

## Tweens

### Translate an entity

To change entity's position over a period of time, use the `utils.tweens.startTranslation`.

This example moves an entity from one position to another over 2 seconds:

```ts
// Required to make scene work
export * from '@dcl/sdk'
// Import SDK functionality and utils library
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

// Create a box
const box = utils.addTestCube()

// Define start and end positions
let startPos = Vector3.create(1, 1, 1)
let endPos = Vector3.create(15, 1, 15)

// Move a box
utils.tweens.startTranslation(box, startPos, endPos, 2)
```

### Rotate an entity

To rotate an entity over a period of time, from one direction to another, use `utils.tweens.startRotation`.

This example rotates an entity from one directions to another over 2 seconds:

```ts
export * from '@dcl/sdk'
import { Quaternion } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

const box = utils.addTestCube()

// Define start and end directions
let startRot = Quaternion.fromEulerDegrees(90, 0, 0)
let endRot = Quaternion.fromEulerDegrees(270, 0, 0)

// Rotate a box
utils.tweens.startRotation(box, startRot, endRot, 2)
```

### Scale an entity

To adjust the scale of an entity over a period of time, from one size to another, use `utils.tweens.startScaling`.

This example scales an entity from one size to another over 2 seconds:

```ts
export * from '@dcl/sdk'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

const box = utils.addTestCube()

// Define start and end sizes
let startSize = Vector3.create(1, 1, 1)
let endSize = Vector3.create(0.75, 2, 0.75)

// Scale a box
utils.tweens.startScaling(box, startSize, endSize, 2)
```

### Non-linear changes

All tweens accept an optional argument which sets the rate of change. By default, translation, rotation, or scaling occur at a linear rate, but this can be set to other options. `utils.InterpolationType` enumeration lists all available interpolation types.

The following example moves a box following a quadratic ease-in rate:

```ts
export * from '@dcl/sdk'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

const box = utils.addTestCube()
let startPos = Vector3.create(1, 1, 1)
let endPos = Vector3.create(15, 1, 15)
utils.tweens.startTranslation(
	box,
	startPos,
	endPos,
	2,
	utils.InterpolationType.EASEINQUAD
)
```

### Stopping tweens and callbacks

`utils.tweens.stopTranslation`, `utils.tweens.stopRotation` and `utils.tweens.stopScaling` stop translation, rotation and scaling respectively.

In the following example tweens affecting a box are stopped when player clicks on a sphere:

```ts
export * from '@dcl/sdk'
import { Quaternion, Vector3, Color4 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

const box = utils.addTestCube()
utils.tweens.startTranslation(
	box,
	Vector3.create(1, 1, 1),
	Vector3.create(15, 1, 15),
	10
)
utils.tweens.startRotation(
	box,
	Quaternion.fromEulerDegrees(0, 0, 0),
	Quaternion.fromEulerDegrees(0, 90, 0),
	10
)
utils.tweens.startScaling(
	box,
	Vector3.create(1, 1, 1),
	Vector3.create(2, 2, 2),
	10
)

const sphere = utils.addTestCube(
	{ position: { x: 2, y: 1, z: 1 } },
	function (event) {
		utils.tweens.stopTranslation(box)
		utils.tweens.stopRotation(box)
		utils.tweens.stopScaling(box)
	},
	undefined,
	Color4.Red(),
	true
)
```

All tweens accept an optional argument `onFinishCallback` which is executed when a tween is complete. It is not executed if a tween was explicitly stopped via stop methods. Use `utils.tweens.getTranslationOnFinishCallback`, `utils.tweens.getRotationOnFinishCallback` and `utils.tweens.getScalingOnFinishCallback` to obtain tween's callback and call it before stopping a tween, if required.

The following example logs a message when the box finishes its movement.

```ts
export * from '@dcl/sdk'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

const box = utils.addTestCube()
utils.tweens.startTranslation(
	box,
	Vector3.create(1, 1, 1),
	Vector3.create(2, 1, 2),
	2,
	utils.InterpolationType.LINEAR,
	function () {
		console.log('Tween is done')
	}
)
```

## Perpetual motions

### Perpetual rotation

To rotate an entity continuously, use `utils.perpetualMotions.smoothRotation`. It takes the following arguments:

- entity: The entity to rotate.
- duration: The time it takes in milliseconds for the entity to do a full 360 turn.
- axis: _(optional)_ Which axis to spin on. Accepted values are _"x"_, _"y"_ and _"z"_. By default it spins on the y axis (never looking up or down from the horizon).

The entity will keep rotating forever until it's explicitly stopped.

Rotation can be stopped by calling `utils.perpetualMotions.stopRotation`.

In the following example, a cube rotates continuously until clicked:

```ts
export * from '@dcl/sdk'
import { Quaternion } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

const box = utils.addTestCube({ position: { x: 1, y: 1, z: 1 } }, function () {
	utils.perpetualMotions.stopRotation(box)
})

utils.perpetualMotions.smoothRotation(box, 1000)
```

## Path following

### Straight path

To move an entity over several points of a path over a period of time, use `utils.paths.startStraightPath`. Along with an entity which will follow a path you must specify two arguments:

- `points`: An array of `Vector3` positions that form the path.
- `duration`: The duration (in seconds) of the whole path.

There is one optional argument:

- `faceDirection`: When set to true, an entity will be rotated to face the direction of its movement.

This example moves an entity through four points over 10 seconds:

```ts
export * from '@dcl/sdk'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

const box = utils.addTestCube({ position: { x: 1, y: 1, z: 1 } })

let path = [
	Vector3.create(1, 1, 1),
	Vector3.create(1, 1, 15),
	Vector3.create(15, 1, 15),
	Vector3.create(15, 1, 1),
]

utils.paths.startStraightPath(box, path, 10)
```

### Smooth path

To make an entity follow a smooth path over a period of time, use `utils.paths.startSmoothPath`. The smooth path is composed of multiple straight line segments put together. You only need to supply a series of fixed path points and a smooth curve is drawn to pass through all of these. You must specify an amount of segments via `segmentCount` argument. `faceDirection` argument works for smooth paths too.

This example makes entity follow a smooth path that's subdivided into 20 segments, over a period of 10 seconds. The curve passes through four key points.

```ts
export * from '@dcl/sdk'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

const box = utils.addTestCube({ position: { x: 1, y: 1, z: 1 } })

let path = [
	Vector3.create(5, 1, 5),
	Vector3.create(5, 1, 11),
	Vector3.create(11, 1, 11),
	Vector3.create(11, 1, 5),
]

utils.paths.startSmoothPath(box, path, 10, 20)
```

If the first and last points of a smooth path are identical, the library tries to facilitate smooth orientation change during movement over a loop. In the example below a box loops through three points forever.

```ts
export * from '@dcl/sdk'
import * as utils from '@dcl-sdk/utils'
import { Color4 } from '@dcl/sdk/math'

// Path points
const p0 = { x: 2, y: 1, z: 2 }
const p1 = { x: 8, y: 1, z: 2 }
const p2 = { x: 8, y: 1, z: 6 }

// Path points' markers
utils.addTestCube(
	{ position: p0 },
	undefined,
	undefined,
	Color4.Red(),
	false,
	true
)
utils.addTestCube(
	{ position: p1 },
	undefined,
	undefined,
	Color4.Green(),
	false,
	true
)
utils.addTestCube(
	{ position: p2 },
	undefined,
	undefined,
	Color4.Blue(),
	false,
	true
)

const box = utils.addTestCube(
	{ position: p0, scale: { x: 1, y: 1, z: 2 } },
	undefined,
	undefined,
	Color4.Yellow(),
	false,
	true
)

function startPath() {
	utils.paths.startSmoothPath(
		// Set the last point of the path to be identical to the first one to achieve looping
		box,
		[p0, p1, p2, p0],
		5,
		50,
		// Set faceDirection to true to align box's rotation with its movement's direction
		true,
		// When path is complete, start it again
		function () {
			startPath()
		}
	)
}

startPath()
```

### Stopping paths and callbacks

Just like tweens, paths can be stopped: use `utils.paths.stopPath` for that purpose. Again, like tweens, path starting functions accept optional `onFinishCallback` argument which is executed after a path finishes. If a path was explicitly stopped via `utils.paths.stopPath`, callback is not executed. Use `utils.paths.getOnFinishCallback` to obtain a callback and call it before stopping a path, if required.

Paths also accept optional `onPointReachedCallback` argument which is executed when a path reaches one of its milestones (`points`).

The following example logs a messages when the box finishes each segment of the path, and another when the entire path is done.

```ts
export * from '@dcl/sdk'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

const box = utils.addTestCube({ position: { x: 1, y: 1, z: 1 } })

let path = [
	Vector3.create(5, 1, 5),
	Vector3.create(5, 1, 11),
	Vector3.create(11, 1, 11),
	Vector3.create(11, 1, 5),
]

utils.paths.startStraightPath(
	box,
	path,
	10,
	false,
	function () {
		console.log('Path is complete')
	},
	function (pointIndex, pointCoords, nextPointCoords) {
		console.log(`Reached point ${pointIndex}`)
	}
)
```

## Toggle

`utils.toggles.*` family of functions enables switching an entity between two possible states, running a specified callback on every transition.

`utils.toggles.addToggle` assigns an initial state (either `utils.ToggleState.On` or `utils.ToggleState.Off`) to an entity and the function to be run on a state change.

`utils.toggles.removeToggle` removes the toggle from an entity.

Entity's state can be set explicitly via `utils.toggles.set` or flipped via `utils.toggles.flip`. Query entity's state by calling `utils.toggles.isOn`: it returns a boolean, where `true` means ON.

Callback can be changed by calling `utils.toggles.setCallback`.

The following example switches the color of a box between two colors each time it's clicked.

```ts
export * from '@dcl/sdk'
import { Material, InputAction, pointerEventsSystem } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

const box = utils.addTestCube({ position: { x: 5, y: 1, z: 5 } })

// Box is initally green
Material.setPbrMaterial(box, { albedoColor: Color4.Green() })

// Add a toggle
utils.toggles.addToggle(box, utils.ToggleState.On, function (value) {
	if (value == utils.ToggleState.On) {
		// Set color to green
		Material.setPbrMaterial(box, { albedoColor: Color4.Green() })
	} else {
		// Set color to red
		Material.setPbrMaterial(box, { albedoColor: Color4.Red() })
	}
})

// Listen for click on the box and toggle its state
pointerEventsSystem.onPointerDown(
	box,
	function (event) {
		utils.toggles.flip(box)
	},
	{
		button: InputAction.IA_POINTER,
		hoverText: 'click',
	}
)
```

### Combine toggle with a tween

This example combines a toggle with a tween to switch an entity between two positions every time it's clicked.

```ts
export * from '@dcl/sdk'
import { InputAction, pointerEventsSystem } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

const box = utils.addTestCube({ position: { x: 5, y: 1, z: 5 } })

// Define two positions for toggling
let pos1 = Vector3.create(5, 1, 5)
let pos2 = Vector3.create(5, 1, 6)

// Box is moved after its state changes
utils.toggles.addToggle(box, utils.ToggleState.Off, function (value) {
	if (value == utils.ToggleState.On) {
		utils.tweens.startTranslation(box, pos1, pos2, 1)
	} else {
		utils.tweens.startTranslation(box, pos2, pos1, 1)
	}
})

// Listen for click on the box and toggle its state
pointerEventsSystem.onPointerDown(
	box,
	function (event) {
		utils.toggles.flip(box)
	},
	{
		button: InputAction.IA_POINTER,
		hoverText: 'click',
	}
)
```

## Timers

These tools are all related to the passage of time in the scene.

### Delay a function

Use `utils.timers.setTimeout` to delay the execution of a function by a given amount of milliseconds.

This example delays the logging of a message by 1000 milliseconds.

```ts
export * from '@dcl/sdk'
import * as utils from '@dcl-sdk/utils'

utils.timers.setTimeout(function () {
	console.log('1 second passed')
}, 1000)
```

### Repeat at an interval

Use `utils.timers.setInterval` to execute a function every `n` milliseconds.

This example creates an entity that changes its scale to a random size every 2 seconds.

```ts
export * from '@dcl/sdk'
import * as utils from '@dcl-sdk/utils'
import { Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

const box = utils.addTestCube()

utils.timers.setInterval(function () {
	let size = Math.random()
	Transform.getMutable(box).scale = Vector3.create(size, size, size)
}, 2000)
```

### Canceling execution

Both `utils.timers.setInterval` and `utils.timers.setTimeout` return a unique `TimerId` which can be used to cancel delayed or repeated execution by calling `utils.timers.clearInterval` and `utils.timers.clearTimeout` respectively. In the example below a box keep changing its color every second until it's clicked on.

```ts
export * from '@dcl/sdk'
import * as utils from '@dcl-sdk/utils'
import { Material, InputAction, pointerEventsSystem } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'

const box = utils.addTestCube({ position: { x: 1, y: 1, z: 1 } })

// Store a timer id in a variable
const timerId = utils.timers.setInterval(function () {
	Material.setPbrMaterial(box, {
		albedoColor: Color4.create(Math.random(), Math.random(), Math.random(), 1),
	})
}, 1000)

pointerEventsSystem.onPointerDown(
	box,
	// Cancel a timer when user clicks on a box
	function (event) {
		utils.timers.clearInterval(timerId)
	},
	{
		button: InputAction.IA_POINTER,
		hoverText: 'click',
	}
)
```

## Triggers

`utils.triggers.*` family of functions powers trigger areas which can be added to entities and which report when intersections with other trigger areas arise or cease.

### Create a trigger

Use `utils.triggers.addTrigger` to add a trigger area to an entity. It has the following arguments:

- `entity`: Trigger's owner entity. Trigger area's coordinates depend on `entity`'s Transform component.
- `layerMask`: Specificies layers to which this trigger belongs to. The library provides eight layers: `utils.LAYER_1`, ... `utils.LAYER_8`. If an entity is supposed to belong to multiple layers, for example layer 1 and layer 3, set `layerMask` to a combination of layer constants separated by `|` (bitwise OR): `utils.LAYER_1 | utils.LAYER_3`. If an entity is supposed to belong to all 8 layers, set `layerMask` to `utils.ALL_LAYERS`. Default value of `layerMask` is `utils.NO_LAYERS`, i.e. an entity does not belong to any layer and won't be able to trigger other entities (it still can be triggered by others, see `triggeredByMask` below).
- `triggeredByMask`: Specifies layers which can trigger an entity. For example, if an entity is supposed to be triggered by entities that belong to either or both layer 2 and layer 4, set `triggeredByMask` to `utils.LAYER_2 | utils.LAYER_4`. Default value of `triggeredByMask` is `utils.NO_LAYERS`, i.e. an entity won't be triggered by other entities at all. When set to `utils.ALL_LAYERS` an entity will be triggered by all entities that belong to at least one layer.
- `areas`: An array of shapes (either boxes or spheres) which describes trigger area. A box is indicated by the object `{type: 'box', position?: Vector3, scale?: Vector3}`, and a sphere by the object `{type: 'sphere', position?: Vector3, radius?: number}`. `position`, `scale` and `radius` fields are optional and default to `{x: 0, y: 0, z: 0}`, `{x: 1, y: 1, z: 1}` and `1` respectively. Please note that box's or sphere's coordinates are relative to `entity`'s Transform. Additionally, box areas always stay axis-aligned, disregarding `entity`'s rotation.
- `onEnterCallback`: This function will be called when a trigger's area intersects with an area of another, layer-compatible trigger. It will receive an entity which owns intersecting trigger as a single argument.
- `onExitCallback`: This function will be called when a trigger's area no longer intersects with an area of another trigger. It will receive an entity which owns formerly intersecting trigger as a single argument.
- `debugColor`: Defines a color of trigger area's shapes when debug visualization is active: call `utils.triggers.enableDebugDraw(true)` to enable it.

The following example creates a trigger that changes its position randomly when triggered by the player. Please note that the library automatically creates a trigger area for the player entity: it's a box closely matching avatar's shape with `layerMask` set to `utils.LAYER_1` and `triggeredByMask` set to `utils.NO_LAYERS`.

```ts
export * from '@dcl/sdk'
import { Transform } from '@dcl/sdk/ecs'
import * as utils from '@dcl-sdk/utils'

// Create a box with disabled collision
const box = utils.addTestCube(
	{ position: { x: 2, y: 1, z: 2 } },
	undefined,
	undefined,
	undefined,
	undefined,
	true
)

utils.triggers.addTrigger(
	box,
	utils.NO_LAYERS,
	utils.LAYER_1,
	[{ type: 'box' }],
	function (otherEntity) {
		console.log(`triggered by ${otherEntity}!`)
		Transform.getMutable(box).position = {
			x: 1 + Math.random() * 14,
			y: 1,
			z: 1 + Math.random() * 14,
		}
	}
)
```

> Tip: to set a custom shape and other parameters of player's trigger first remove a default trigger via `utils.triggers.removeTrigger(engine.PlayerEntity)` and then specify your own trigger via `utils.triggers.addTrigger(engine.PlayerEntity, ...)`.

### Disable a trigger

You can temporarily disable a trigger by calling `utils.triggers.enableTrigger(entity, false)`. Enable it again by calling `utils.triggers.enableTrigger(entity, true)`. Remove trigger altogether by calling `utils.triggers.removeTrigger(entity)`.

### One time Trigger

As a shortcut for creating a trigger area that is only actioned once when the player first walks in or out, use the `utils.triggers.oneTimeTrigger`. This function has same arguments as `utils.triggers.addTrigger`, apart for `onExitCallback`. This function is especially useful for optimizing the loading of a scene, so that certain elements aren't loaded till a player walks into an area.

In the example below, the trigger area will only display welcome message the first time a player walks in. After that, the entity is removed from the scene.

```ts
export * from '@dcl/sdk'
import { engine, Transform } from '@dcl/sdk/ecs'
import * as utils from '@dcl-sdk/utils'

const triggerEntity = engine.addEntity()
Transform.create(triggerEntity)

utils.triggers.oneTimeTrigger(
	triggerEntity,
	utils.NO_LAYERS,
	utils.LAYER_1,
	[
		{
			type: 'box',
			position: { x: 4, y: 1, z: 4 },
			scale: { x: 8, y: 1, z: 8 },
		},
	],
	function (otherEntity) {
		console.log('Welcome!')
	}
)
```

### Trigger layers

You can define different layers for triggers, and set which other layers can trigger it.

The following example creates a scene that has:

- food (green box)
- mouse (blue sphere)
- cat (red sphere)

Food is triggered (or eaten) by both cat and mouse. Also, mice are eaten by cats, so a mouse's trigger area is triggered only by a cat.

Cat and mouse always move towards the food. When food or mouse are eaten, they respawn in a random location.

```ts
export * from '@dcl/sdk'
import { engine, Transform } from '@dcl/sdk/ecs'
import * as utils from '@dcl-sdk/utils'
import { Color4 } from '@dcl/sdk/math'

// Define layers
const FOOD_LAYER = utils.LAYER_1
const MOUSE_LAYER = utils.LAYER_2
const CAT_LAYER = utils.LAYER_3

// Remove default trigger from a player so that they don't interfere
utils.triggers.removeTrigger(engine.PlayerEntity)

// Create food
const food = utils.addTestCube(
	{ position: { x: 1 + Math.random() * 14, y: 0, z: 1 + Math.random() * 14 } },
	undefined,
	undefined,
	Color4.Green(),
	false,
	true
)
utils.triggers.addTrigger(
	food,
	FOOD_LAYER,
	MOUSE_LAYER | CAT_LAYER,
	[{ type: 'box' }],
	function (otherEntity) {
		// Food was eaten either by cat or mouse, "respawn" it
		Transform.getMutable(food).position = {
			x: 1 + Math.random() * 14,
			y: 0,
			z: 1 + Math.random() * 14,
		}
		// Set mouse and cat moving towards food
		utils.tweens.startTranslation(
			mouse,
			Transform.get(mouse).position,
			Transform.get(food).position,
			4
		)
		utils.tweens.startTranslation(
			cat,
			Transform.get(cat).position,
			Transform.get(food).position,
			4
		)
	}
)

// Create mouse
const mouse = utils.addTestCube(
	{
		position: { x: 1 + Math.random() * 14, y: 0, z: 1 + Math.random() * 14 },
		scale: { x: 0.5, y: 0.5, z: 0.5 },
	},
	undefined,
	undefined,
	Color4.Blue(),
	true,
	true
)
utils.triggers.addTrigger(
	mouse,
	MOUSE_LAYER,
	CAT_LAYER,
	[{ type: 'sphere', radius: 0.25 }],
	function (otherEntity) {
		// Mouse was eaten by cat, "respawn" it
		Transform.getMutable(mouse).position = {
			x: 1 + Math.random() * 14,
			y: 0,
			z: 1 + Math.random() * 14,
		}
		// Set mouse moving towards food
		utils.tweens.startTranslation(
			mouse,
			Transform.get(mouse).position,
			Transform.get(food).position,
			4
		)
	}
)

// Create cat
const cat = utils.addTestCube(
	{ position: { x: 1 + Math.random() * 14, y: 0, z: 1 + Math.random() * 14 } },
	undefined,
	undefined,
	Color4.Red(),
	true,
	true
)
utils.triggers.addTrigger(cat, CAT_LAYER, CAT_LAYER, [
	{ type: 'sphere', radius: 0.5 },
])

// Set mouse and cat moving towards food
utils.tweens.startTranslation(
	mouse,
	Transform.get(mouse).position,
	Transform.get(food).position,
	4
)
utils.tweens.startTranslation(
	cat,
	Transform.get(cat).position,
	Transform.get(food).position,
	4
)
```

## Math

### Remap

`utils.remap` maps a value from one range of values to its equivalent, scaled in proportion to another range of values, using maximum and minimum. It takes the following arguments:

- `value`: Input number to convert
- `min1`: Minimum value in the range of the input.
- `max1`: Maximum value in the range of the input.
- `min2`: Minimum value in the range of the output.
- `max2`: Maximum value in the range of the output.

The following example maps the value _5_ from a scale of 0 to 10 to a scale of 300 to 400. The resulting value is 350, as it keeps the same proportion relative to the new maximum and minimum values.

```ts
export * from '@dcl/sdk'
import * as utils from '@dcl-sdk/utils'

let input = 5
let result = utils.remap(input, 0, 10, 300, 400)
console.log(result)
```

### World position

If an entity is parented to another entity, or to the player, then its Transform position will be relative to its parent. To find what its global position is, taking into account any parents, use `utils.getWorldPosition`. It returns a `Vector3` object, with the resulting position of adding the given entity and all its chain of parents.

The following example sets a cube as a child of another cube, and logs its world position.

```ts
export * from '@dcl/sdk'
import * as utils from '@dcl-sdk/utils'
import { Transform } from '@dcl/sdk/ecs'

const cube = utils.addTestCube({ position: { x: 1, y: 1, z: 1 } })
const childCube = utils.addTestCube({ position: { x: 0, y: 1, z: 0 } })
Transform.getMutable(childCube).parent = cube

const worldPos = utils.getWorldPosition(childCube)
console.log(`${worldPos.x} ${worldPos.y} ${worldPos.z}`)
```

### World rotation

If an entity is parented to another entity, or to the player, then its Transform rotation will be relative to its parent. To find what its global rotation is, taking into account any parents, use `utils.getWorldRotation`. It returns a `Quaternion` object, with the resulting rotation of multiplying the given entity to all its chain of parents.

The following example sets a cube as a child of another cube, and logs its world rotation.

```ts
export * from '@dcl/sdk'
import * as utils from '@dcl-sdk/utils'
import { Transform } from '@dcl/sdk/ecs'
import { Quaternion } from '@dcl/sdk/math'

const cube = utils.addTestCube({
	position: { x: 1, y: 1, z: 1 },
	rotation: Quaternion.fromEulerDegrees(0, 30, 0),
})
const childCube = utils.addTestCube({
	position: { x: 0, y: 1, z: 0 },
	rotation: Quaternion.fromEulerDegrees(0, 60, 0),
})
Transform.getMutable(childCube).parent = cube

const worldRot = Quaternion.toEulerAngles(utils.getWorldRotation(childCube))
console.log(`${worldRot.x} ${worldRot.y} ${worldRot.z}`)
```

## Other helpers

The library offers a few other functions that may be useful as shortcuts for common use cases.

## Get entity parent

Returns an entity that is the parent of the provided entity.

```ts
export * from '@dcl/sdk'
import * as utils from '@dcl-sdk/utils'

const box = utils.addTestCube()

const boxParent = utils.addTestCube()

// set boxParent as the parent of box
Transform.getMutable(box).parent = boxParent

const parent = utils.getEntityParent(box)

// should log the id of boxParent
console.log(parent)
```

## Get entities with parent

Returns an array of entities that all share the provided entity as parent.

```ts
export * from '@dcl/sdk'
import * as utils from '@dcl-sdk/utils'

const box = utils.addTestCube()

const boxParent = utils.addTestCube()

// set boxParent as the parent of box
Transform.getMutable(box).parent = boxParent

const children = utils.getEntitiesWithParent(boxParent)

// should log an array including the id of box
console.log(children)
```

## Get player position

Returns the position of the player's avatar.

```ts
export * from '@dcl/sdk'
import * as utils from '@dcl-sdk/utils'

export function main() {
	const playerPos = utils.getPlayerPosition()

	// should log the player's current position
	console.log(playerPos)
}
```

Note: Always call this function inside the main() function, a function called indirectly by it, or a system. Otherwise, you might be attempting to fetch data that doesn't yet exist.

## Play sound

Plays a sound from an audio file, at a given location in the scene. This saves you from having to create an entity and give it a position and AudioSource component.

```ts
export * from '@dcl/sdk'
import * as utils from '@dcl-sdk/utils'

export function main() {
	// play once at the camera's position
	utils.playSound('assets/sounds/hooray.mp3')

	// loop as a positional sound in a given location
	utils.playSound('assets/sounds/crickets.mp3', true, Vector3.create(10, 1, 14))
}
```

## Action sequence

Use an action sequence to play a series of actions one after another.

### IAction

The `actions.IAction` interface defines the actions that can be added into a sequence. It includes:

- `hasFinished`: Boolean for the state of the action, wether it has finished its execution or not.
- `onStart()`: First method that is called upon the execution of the action.
- `update()`: Called on every frame on the action's internal update.
- `onFinish()`: Called when the action has finished executing.

### Sequence builder

This object creates action sequences, using simple building blocks.

The `actions.SequenceBuilder` exposes the following methods:

- `then()`: Enqueue an action so that it's executed when the previous one finishes.
- `if()`: Use a condition to branch the sequence
- `else()`: Used with if() to create an alternative branch
- `endIf()`: Ends the definition of the conditional block
- `while()`: Keep running the actions defined in a block until a condition is no longer met.
- `breakWhile()`: Ends the definition of the while block

### Sequence runner

The `actions.SequenceRunner` object takes care of running sequences created by `actions.SequenceBuilder`. It exposes the following methods:

- `startSequence()`: Starts a sequence of actions
- `setOnFinishCallback()`: Sets a callback for when the whole sequence is finished
- `isRunning()`: Returns a boolean that determines if the sequence is running
- `stop()`: Stops a running the sequence
- `resume()`: Resumes a stopped sequence
- `reset()`: Resets a sequence so that it starts over
- `destroy()`: Removes a sequence from the engine

### Full example

The following example creates a box that changes its scale until clicked. Then it resets its scale and moves.

```ts
export * from '@dcl/sdk'
import { engine, Transform, Entity } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl-sdk/utils'

// Set clicked flag
let boxClicked = false

// Create box entity
const box = utils.addTestCube({ position: { x: 14, y: 0, z: 14 } }, (e) => {
	boxClicked = true
})

// Use IAction to define action for scaling
class ScaleAction implements utils.actions.IAction {
	hasFinished: boolean = false
	entity: Entity
	scale: Vector3

	constructor(entity: Entity, scale: Vector3) {
		this.entity = entity
		this.scale = scale
	}

	// Method when action starts
	onStart(): void {
		const transform = Transform.get(this.entity)
		this.hasFinished = false

		utils.tweens.startScaling(
			this.entity,
			transform.scale,
			this.scale,
			1.5,
			utils.InterpolationType.EASEINQUAD,
			() => {
				this.hasFinished = true
			}
		)
	}
	// Method to run on every frame
	update(dt: number): void {}
	// Method to run at the end
	onFinish(): void {}
}

// Use IAction to define action for translation
class MoveAction implements utils.actions.IAction {
	hasFinished: boolean = false
	entity: Entity
	position: Vector3

	constructor(entity: Entity, position: Vector3) {
		this.entity = entity
		this.position = position
	}

	onStart(): void {
		const transform = Transform.get(this.entity)

		utils.tweens.startTranslation(
			this.entity,
			transform.position,
			this.position,
			4,
			utils.InterpolationType.LINEAR,
			() => {
				this.hasFinished = true
			}
		)
	}

	update(dt: number): void {}

	onFinish(): void {}
}

// Use sequence builder to create a sequence
const builder = new utils.actions.SequenceBuilder()
	.while(() => !boxClicked)
	.then(new ScaleAction(box, Vector3.create(1.5, 1.5, 1.5)))
	.then(new ScaleAction(box, Vector3.create(0.5, 0.5, 0.5)))
	.endWhile()
	.then(new ScaleAction(box, Vector3.create(1, 1, 1)))
	.then(new MoveAction(box, Vector3.create(1, 0, 1)))

// Run built sequence and destroy it once it finishes
const runner = new utils.actions.SequenceRunner(engine, builder, () => {
	runner.destroy()
})
```
