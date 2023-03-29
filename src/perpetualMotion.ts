import { engine, Entity, IEngine, Schemas, Transform } from '@dcl/sdk/ecs'
import { Quaternion } from '@dcl/sdk/math'
import { priority } from './priority'

export type PerpetualMotions = ReturnType<typeof createPerpetualMotions>

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
    startRotation(entity: Entity, velocity: Quaternion) {
      PerpetualRotation.createOrReplace(entity, {velocity: velocity})
    },
    stopRotation(entity: Entity) {
      PerpetualRotation.deleteFrom(entity)
    }
  }
}

export const perpetualMotions = createPerpetualMotions(engine)
