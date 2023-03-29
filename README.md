# @dcl/sdk7-utils

This library includes a number of helpful pre-built tools that include components, methods, and systems. They offer simple solutions to common scenarios that you're likely to run into.

- [Tweens](#tweens)
  - [Translate an entity](#translate-an-entity)
  - [Rotate an entity](#rotate-an-entity)
  - [Scale an entity](#scale-an-entity)
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
// Required to make scene work
export * from '@dcl/sdk'
// Import SDK functionality and utils library
import { Quaternion } from '@dcl/sdk/math'
import * as utils from '@dcl/sdk7-utils'

// Create a box
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
// Required to make scene work
export * from '@dcl/sdk'
// Import SDK functionality and utils library
import { Vector3 } from '@dcl/sdk/math'
import * as utils from '@dcl/sdk7-utils'

// Create a box
const box = utils.addTestCube()

// Define start and end sizes
let startSize = Vector3.create(1, 1, 1)
let endSize = Vector3.create(0.75, 2, 0.75)

// Scale a box
utils.tweens.startScaling(box, startSize, endSize, 2)
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
// Required to make scene work
export * from '@dcl/sdk'
// Import SDK functionality and utils library
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

  // Method when action starts
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
  // Method to run on every frame
  update(dt: number): void {}
  // Method to run at the end
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
const sequence = new utils.actions.SequenceRunner(
  engine, builder, () => { sequence.destroy() }
)
```
