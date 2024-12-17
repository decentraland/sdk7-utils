import { EasingFunction, Entity, IEngine, ISchema, MapComponentDefinition, MapResult, QuaternionType, Schemas, TweenLoop } from '@dcl/sdk/ecs'
import { Quaternion } from '@dcl/sdk/math'
import { priority } from './priority'
import { getSDK } from './sdk'

export type PerpetualMotions = ReturnType<typeof initPerpetualMotions>

export enum AXIS {
  X = 'x',
  Y = 'y',
  Z = 'z'
}
let PerpetualRotation: MapComponentDefinition<MapResult<{ velocity: ISchema<QuaternionType> }>>

function initPerpetualMotions() {
  const { engine, components: { Transform } } = getSDK()

  PerpetualRotation = engine.defineComponent('dcl.utils.PerpetualRotation', {
    velocity: Schemas.Quaternion
  })

  function system(dt: number) {
    for (const [entity, rotation] of engine.getEntitiesWith(PerpetualRotation, Transform)) {
      const rotationDelta = Quaternion.slerp(Quaternion.Identity(), rotation.velocity, dt)
      const transform = Transform.getMutable(entity)
      transform.rotation = Quaternion.normalize(Quaternion.multiply(transform.rotation, rotationDelta))
    }
  }

  engine.addSystem(system, priority.PerpetualMotionSystemPriority)

}

// Deprecated! Use smoothRotation instead
export function startRotation(entity: Entity, velocity: Quaternion) {
  PerpetualRotation.createOrReplace(entity, { velocity: velocity })
}

export function stopRotation(entity: Entity) {
  const { components: { Tween, TweenSequence } } = getSDK()

  if (Tween.has(entity)) {
    Tween.deleteFrom(entity)
  }
  if (TweenSequence.has(entity)) {
    TweenSequence.deleteFrom(entity)
  }

  if (PerpetualRotation.has(entity)) {
    PerpetualRotation.deleteFrom(entity)
  }

}

export function smoothRotation(entity: Entity, duration: number, axis?: AXIS) {
  const { components: { Tween, TweenSequence } } = getSDK()

  let firstEnd = Quaternion.fromEulerDegrees(0, 180, 0)
  let secondEnd = Quaternion.fromEulerDegrees(0, 360, 0)

  switch (axis) {
    case AXIS.X:
      firstEnd = Quaternion.fromEulerDegrees(180, 0, 0)
      secondEnd = Quaternion.fromEulerDegrees(360, 0, 0)
      break
    case AXIS.Y:
      firstEnd = Quaternion.fromEulerDegrees(0, 180, 0)
      secondEnd = Quaternion.fromEulerDegrees(0, 360, 0)
      break

    case AXIS.Z:
      firstEnd = Quaternion.fromEulerDegrees(0, 0, 180)
      secondEnd = Quaternion.fromEulerDegrees(0, 0, 360)
      break
  }

  Tween.createOrReplace(entity, {
    mode: Tween.Mode.Rotate({
      start: Quaternion.fromEulerDegrees(0, 0, 0),
      end: firstEnd
    }),
    duration: duration / 2,
    easingFunction: EasingFunction.EF_LINEAR
  })
  TweenSequence.create(entity, {
    loop: TweenLoop.TL_RESTART,
    sequence: [
      {
        mode: Tween.Mode.Rotate({
          start: firstEnd,
          end: secondEnd
        }),
        duration: duration / 2,
        easingFunction: EasingFunction.EF_LINEAR
      }
    ]
  })
}