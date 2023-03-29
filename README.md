# @dcl/sdk7-utils

This library includes a number of helpful pre-built tools that offer simple solutions to common scenarios that you're likely to run into.

- [Tweens](#tweens)
  - [Translate an entity](#translate-an-entity)
  - [Rotate an entity](#rotate-an-entity)
  - [Scale an entity](#scale-an-entity)
  - [Non-linear changes](#non-linear-changes)
  - [Stopping tweens and callbacks](#stopping-tweens-and-callbacks)
- [Perpetual motions](#perpetual-motions)
  - [Perpetual rotation](#perpetual-rotation)
- [Path following](#path-following)
  - [Straight path][#straight-path]
  - [Smooth path][#smooth-path]
  - [Stopping paths and callbacks](#stopping-paths-and-callbacks)
- [Action sequence](#action-sequence)
  - [IAction](#iaction)
  - [Sequence builder](#sequence-builder)
  - [Sequence runner](#sequence-runner)
  - [Full example](#full-example)

## Using the Utils library

To use any of the helpers provided by the utils library

1. Install it as an `npm` package. Run this command in your scene's project folder:

```
npm install @dcl/sdk7-utils -B
```

2. Run `dcl start` or `dcl build` so the dependencies are correctly installed.

3. Import the library into the scene's script. Add this line at the start of TypeScript files that require it:

```ts
import * as utils from '@dcl/sdk7-utils'
```

4. In your TypeScript file, write `utils.` and let the suggestions of your IDE show the available helpers.

## Tweens

### Translate an entity

To change entity's position over a period of time, use the `utils.tweens.startTranslation`.

This example moves an entity from one position to another over 2 seconds:

```ts
// Required to make scene work
export * from '@dcl/sdk'
// Import SDK functionality and utils library
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl/sdk7-utils'

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
import * as utils from '@dcl/sdk7-utils'

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
import * as utils from '@dcl/sdk7-utils'

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
import * as utils from '@dcl/sdk7-utils'

const box = utils.addTestCube()
let startPos = Vector3.create(1, 1, 1)
let endPos = Vector3.create(15, 1, 15)
utils.tweens.startTranslation(box, startPos, endPos, 2, utils.InterpolationType.EASEINQUAD)
```

### Stopping tweens and callbacks

`utils.tweens.stopTranslation`, `utils.tweens.stopRotation` and `utils.tweens.stopScaling` stop translation, rotation and scaling respectively.

In the following example tweens affecting a box are stopped when player clicks on a sphere:

```ts
export * from '@dcl/sdk'
import { Quaternion, Vector3, Color4 } from '@dcl/sdk/math'
import * as utils from '@dcl/sdk7-utils'

const box = utils.addTestCube()
utils.tweens.startTranslation(box, Vector3.create(1, 1, 1), Vector3.create(15, 1, 15), 10)
utils.tweens.startRotation(box, Quaternion.fromEulerDegrees(0, 0, 0), Quaternion.fromEulerDegrees(0, 90, 0), 10)
utils.tweens.startScaling(box, Vector3.create(1, 1, 1), Vector3.create(2, 2, 2), 10)

const sphere = utils.addTestCube(
  {position: {x: 2, y: 1, z: 1}},
  function(event) {
    utils.tweens.stopTranslation(box)
    utils.tweens.stopRotation(box)
    utils.tweens.stopScaling(box)
  },
  undefined, Color4.Red(), true
)
```

All tweens accept an optional argument `onFinishCallback` which is executed when a tween is complete or when a tween is stopped explicitly via calls described above.

The following example logs a message when the box finishes its movement.

```ts
export * from '@dcl/sdk'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl/sdk7-utils'

const box = utils.addTestCube()
utils.tweens.startTranslation(
  box, Vector3.create(1, 1, 1), Vector3.create(2, 1, 2), 2, utils.InterpolationType.LINEAR,
  function() { console.log('Tween is done') }
)
```

## Perpetual motions

### Perpetual rotation

To rotate an entity continuously, use `utils.perpetualMotions.startRotation`. The entity will keep rotating forever until it's explicitly stopped. `rotationVelocity` argument is a quaternion describing the desired rotation to perform each second second. For example `Quaternion.fromEulerDegrees(0, 45, 0)` rotates the entity on the Y axis at a speed of 45 degrees per second, meaning that it makes a full turn every 8 seconds.

Rotation can be stopped by calling `utils.perpetualMotions.stopRotation`.

In the following example, a cube rotates continuously until clicked:

```ts
export * from '@dcl/sdk'
import { Quaternion } from '@dcl/sdk/math'
import * as utils from '@dcl/sdk7-utils'

const box = utils.addTestCube(
  {position: {x: 1, y: 1, z: 1}},
  function() { utils.perpetualMotions.stopRotation(box) }
)

utils.perpetualMotions.startRotation(box, Quaternion.fromEulerDegrees(0, 45, 0))
```

## Path following

### Straight path

To move an entity over several points of a path over a period of time, use `utils.paths.startStraightPath`. Along with an entity which will follow a path you must specify two arguments:

- `points`: An array of `Vector3` positions that form the path.
- `duration`: The duration (in seconds) of the whole path.

There are two optional arguments:

- `loop`: When set to true, path becomes closed, after reaching a final point, an entity will proceed to the first one.
- `faceDirection`: When set to true, an entity will be rotated to face the direction of its movement.

This example moves an entity through four points over 10 seconds:

```ts
export * from '@dcl/sdk'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl/sdk7-utils'

const box = utils.addTestCube({position: {x: 1, y: 1, z: 1}})

let path = [
  Vector3.create(1, 1, 1),
  Vector3.create(1, 1, 15),
  Vector3.create(15, 1, 15),
  Vector3.create(15, 1, 1)
]

utils.paths.startStraightPath(box, path, 10)
```

### Smooth path

To make an entity follow a smooth path over a period of time, use `utils.paths.startSmoothPath`. The smooth path is composed of multiple straight line segments put together. You only need to supply a series of fixed path points and a smooth curve is drawn to pass through all of these. You must specify an amount of segments via `segmentCount` argument.

> Tip: Each segment takes at least one frame to complete. Avoid using more than 30 segments per second in the duration of the path, or the entity will move significantly slower while it stops for each segment.

This example makes entity follow a smooth path that's subdivided into 20 segments, over a period of 10 seconds. The curve passes through four key points.

```ts
export * from '@dcl/sdk'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl/sdk7-utils'

const box = utils.addTestCube({position: {x: 1, y: 1, z: 1}})

let path = [
  Vector3.create(5, 1, 5),
  Vector3.create(5, 1, 11),
  Vector3.create(11, 1, 11),
  Vector3.create(11, 1, 5)
]

utils.paths.startSmoothPath(box, path, 10, 20)
```

`loop` and `faceDirection` arguments work for smooth paths too.

### Stopping paths and callbacks

Just like tweens, paths can be stopped: use `utils.paths.stopPath` for that purpose. Again, like tweens, path starting functions accept optional `onFinishCallback` argument which is executed after a path finishes or is explicitly stopped.

Straight paths also accept optional `onPointReachedCallback` argument which is executed when a path reaches one of its milestones (`points`).

The following example logs a messages when the box finishes each segment of the path, and another when the entire path is done.

```ts
export * from '@dcl/sdk'
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl/sdk7-utils'

const box = utils.addTestCube({position: {x: 1, y: 1, z: 1}})

let path = [
  Vector3.create(5, 1, 5),
  Vector3.create(5, 1, 11),
  Vector3.create(11, 1, 11),
  Vector3.create(11, 1, 5)
]

utils.paths.startStraightPath(
  box, path, 10, false, false,
  function() {
    console.log('Path is complete')
  },
  function(pointIndex, pointCoords, nextPointCoords) {
    console.log(`Reached point ${pointIndex}`)
  }
)
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
import * as utils from '@dcl/sdk7-utils'

// Set clicked flag
let boxClicked = false

// Create box entity
const box = utils.addTestCube(
  {position: {x: 14, y: 0, z: 14}},
  (e) => { boxClicked = true }
)

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
      () => {this.hasFinished = true}
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
      () => { this.hasFinished = true }
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
const runner = new utils.actions.SequenceRunner(
  engine, builder, () => { runner.destroy() }
)
```
