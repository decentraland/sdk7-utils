import { EasingFunction, engine, Entity, IEngine, Schemas, Transform, Tween, TweenLoop, TweenSequence } from '@dcl/sdk/ecs'
import { Quaternion } from '@dcl/sdk/math'
import { priority } from './priority'

export type PerpetualMotions = ReturnType<typeof createPerpetualMotions>


export enum AXIS {
  X = 'x',
  Y = 'y',
  Z = 'z'
}

function createPerpetualMotions(targetEngine: IEngine) {
  const PerpetualRotation = targetEngine.defineComponent('dcl.utils.PerpetualRotation', {
    velocity: Schemas.Quaternion
  })

  function system(dt: number) {
    for (const [entity, rotation] of targetEngine.getEntitiesWith(PerpetualRotation, Transform)) {
      const rotationDelta = Quaternion.slerp(Quaternion.Identity(), rotation.velocity, dt)
      const transform = Transform.getMutable(entity)
      transform.rotation = Quaternion.normalize(Quaternion.multiply(transform.rotation, rotationDelta))
    }
  }

  targetEngine.addSystem(system, priority.PerpetualMotionSystemPriority)

  return {
    // Deprecated! Use smoothRotation instead
    startRotation(entity: Entity, velocity: Quaternion) {
      PerpetualRotation.createOrReplace(entity, { velocity: velocity })
    },
    stopRotation(entity: Entity) {

      if (Tween.has(entity)) {
        Tween.deleteFrom(entity)
      }
      if (TweenSequence.has(entity)) {
        TweenSequence.deleteFrom(entity)
      }

      if (PerpetualRotation.has(entity)) {
        PerpetualRotation.deleteFrom(entity)
      }

    },
    smoothRotation(entity: Entity, duration: number, axis?: AXIS) {

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
  }
}

export const perpetualMotions = createPerpetualMotions(engine)
