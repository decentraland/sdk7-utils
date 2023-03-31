import { engine, Entity, IEngine, MeshRenderer, Schemas, Transform, Material, DeepReadonly } from '@dcl/sdk/ecs'
import { Vector3, Color4, Color3 } from '@dcl/sdk/math'
import { getWorldPosition, getWorldRotation, areAABBIntersecting, areAABBSphereIntersecting, areSpheresIntersecting } from './math'
import { priority } from './priority'

export type TriggerBoxAreaSpec = {
  type: 'box',
  position?: Vector3,
  scale?: Vector3
}

export type TriggerSphereAreaSpec = {
  type: 'sphere',
  position?: Vector3,
  radius?: number
}

export type TriggerAreaSpec = TriggerBoxAreaSpec | TriggerSphereAreaSpec

export type TriggerBoxArea = {
  position: Vector3,
  size: Vector3
}

export type TriggerSphereArea = {
  position: Vector3,
  radius: number
}

type OnTriggerEnterCallback = (entity: Entity) => void
type OnTriggerExitCallback = (entity: Entity) => void

export type Triggers = ReturnType<typeof createTriggers>

function createTriggers(targetEngine: IEngine) {
  const Trigger = engine.defineComponent('dcl.utils.Trigger', {
    active: Schemas.Boolean,
    layerMask: Schemas.Int,
    triggeredByMask: Schemas.Int,
    boxAreas: Schemas.Array(Schemas.Map({
      position: Schemas.Vector3,
      size: Schemas.Vector3
    })),
    sphereAreas: Schemas.Array(Schemas.Map({
      position: Schemas.Vector3,
      radius: Schemas.Number
    })),
    debugColor: Schemas.Color3
  })

  type TriggerType = {
    active: boolean,
    layerMask: number,
    triggeredByMask: number,
    boxAreas: Array<TriggerBoxArea>,
    sphereAreas: Array<TriggerSphereArea>,
    debugColor: Color3
  }

  const triggerEnterCbs: Map<Entity, OnTriggerEnterCallback | undefined> = new Map()
  const triggerExitCbs: Map<Entity, OnTriggerExitCallback | undefined> = new Map()

  let debugDraw = false
  const activeCollisions: Map<Entity, Set<Entity>> = new Map()
  const debugEntities: Map<Entity, Array<Entity>> = new Map()

  type ShapeWorldPositions = {"box": Array<Vector3>, "sphere": Array<Vector3>}

  function updateDebugDraw(enabled: boolean) {
    if (!enabled)
      return

    for (const [entity, trigger] of targetEngine.getEntitiesWith(Trigger, Transform)) {
      let shapes = debugEntities.get(entity)!

      const boxCount = trigger.boxAreas.length
      const sphereCount = trigger.sphereAreas.length
      while (shapes.length > boxCount + sphereCount) {
        targetEngine.removeEntity(shapes.pop()!)
      }
      while(shapes.length < boxCount + sphereCount) {
        shapes.push(targetEngine.addEntity())
      }

      const worldPosition = getWorldPosition(entity)
      const worldRotation = getWorldRotation(entity)

      for (let i = 0; i < boxCount; ++i) {
        const shapeSpec = trigger.boxAreas[i]
        const shape = shapes[i]
        Transform.createOrReplace(shape, {
          position: Vector3.add(worldPosition, Vector3.rotate(shapeSpec.position, worldRotation)),
          scale: shapeSpec.size
        })
        MeshRenderer.setBox(shape)
        const color = trigger.active ? trigger.debugColor : Color3.Black()
        Material.setPbrMaterial(shape, {albedoColor: Color4.fromInts(255 * color.r, 255 * color.g, 255 *color.b, 75)})
      }

      for (let i = 0; i < sphereCount; ++i) {
        const shapeSpec = trigger.sphereAreas[i]
        const shape = shapes[boxCount + i]
        Transform.createOrReplace(shape, {
          position: Vector3.add(worldPosition, Vector3.rotate(shapeSpec.position, worldRotation)),
          scale: {x: shapeSpec.radius, y: shapeSpec.radius, z: shapeSpec.radius}
        })
        MeshRenderer.setSphere(shape)
        const color = trigger.active ? trigger.debugColor : Color3.Black()
        Material.setPbrMaterial(shape, {albedoColor: Color4.fromInts(255 * color.r, 255 * color.g, 255 * color.b, 75)})
      }
    }
  }

  function areTriggersIntersecting(
    shapeWorldPos0: ShapeWorldPositions,
    t0: DeepReadonly<TriggerType>,
    shapeWorldPos1: ShapeWorldPositions,
    t1: DeepReadonly<TriggerType>
  ): boolean {
    for (let i = 0; i < t0.boxAreas.length; ++i) {
      const t0Box = t0.boxAreas[i]
      const t0World = shapeWorldPos0.box[i]
      const t0Min = Vector3.subtract(t0World, Vector3.scale(t0Box.size, 0.5))
      const t0Max = Vector3.add(t0Min, t0Box.size)

      for (let j = 0; j < t1.boxAreas.length; ++j) {
        const t1Box = t1.boxAreas[j]
        const t1World = shapeWorldPos1.box[j]
        const t1Min = Vector3.subtract(t1World, Vector3.scale(t1Box.size, 0.5))
        const t1Max = Vector3.add(t1Min, t1Box.size)

        if (areAABBIntersecting(t0Min, t0Max, t1Min, t1Max))
          return true
      }

      for (let j = 0; j < t1.sphereAreas.length; ++j) {
        if (areAABBSphereIntersecting(t0Min, t0Max, shapeWorldPos1.sphere[j], t1.sphereAreas[j].radius))
          return true
      }
    }

    for (let i = 0; i < t0.sphereAreas.length; ++i) {
      const t0World = shapeWorldPos0.sphere[i]
      const t0Radius = t0.sphereAreas[i].radius

      for (let j = 0; j < t1.boxAreas.length; ++j) {
        const t1Box = t1.boxAreas[j]
        const t1World = shapeWorldPos1.box[j]
        const t1Min = Vector3.subtract(t1World, Vector3.scale(t1Box.size, 0.5))
        const t1Max = Vector3.add(t1Min, t1Box.size)

        if (areAABBSphereIntersecting(t1Min, t1Max, t0World, t0Radius))
          return true
      }

      for (let j = 0; j < t1.sphereAreas.length; ++j) {
        if (areSpheresIntersecting(t0World, t0Radius, shapeWorldPos1.sphere[j], t1.sphereAreas[j].radius))
          return true
      }
    }

    return false
  }

  function computeCollisions(entity: Entity, shapeWorldPos: Map<Entity, ShapeWorldPositions>) {
    let collisions: Set<Entity> = new Set()
    const trigger = Trigger.get(entity)

    if (!trigger.active)
      return collisions
    
    for (const [otherEntity, otherTrigger] of targetEngine.getEntitiesWith(Trigger, Transform)) {
      if (otherEntity == entity)
        continue
      
      if (!otherTrigger.active)
        continue
      
      if (trigger.triggeredByMask != 0 && !(trigger.triggeredByMask & otherTrigger.layerMask))
        continue
      
      const intersecting = areTriggersIntersecting(shapeWorldPos.get(entity)!, trigger, shapeWorldPos.get(otherEntity)!, otherTrigger)
      if (intersecting)
        collisions.add(otherEntity)
    }

    return collisions
  }

  function updateCollisions() {
    const collisionsStarted = []
    const collisionsEnded = []
    const shapeWorldPositions: Map<Entity, ShapeWorldPositions> = new Map()

    for (const [entity, trigger] of targetEngine.getEntitiesWith(Trigger, Transform)) {
      const boxPositions = []
      const spherePositions = []
      const entityWorldPosition = getWorldPosition(entity)
      const entityWorldRotation = getWorldRotation(entity)
      for (const shape of trigger.boxAreas) {
        boxPositions.push(Vector3.add(entityWorldPosition, Vector3.rotate(shape.position, entityWorldRotation)))
      }
      for (const shape of trigger.sphereAreas) {
        spherePositions.push(Vector3.add(entityWorldPosition, Vector3.rotate(shape.position, entityWorldRotation)))
      }
      shapeWorldPositions.set(entity, {box: boxPositions, sphere: spherePositions})
    }

    for (const [entity] of targetEngine.getEntitiesWith(Trigger, Transform)) {
      const newCollisions = computeCollisions(entity, shapeWorldPositions)
      const oldCollisions = activeCollisions.get(entity)!
      
      for (const oldCollision of oldCollisions) {
        if (!newCollisions.has(oldCollision))
          collisionsEnded.push([entity, oldCollision])
      }

      for (const newCollision of newCollisions) {
        if (!oldCollisions.has(newCollision))
          collisionsStarted.push([entity, newCollision])
      }
      
      activeCollisions.set(entity, newCollisions)
    }

    for (const [entity, collision] of collisionsStarted) {
      const callback = triggerEnterCbs.get(entity)
      if (callback)
        callback(collision)
    }

    for (const [entity, collision] of collisionsEnded) {
      const callback = triggerExitCbs.get(entity)
      if (callback)
        callback(collision)
    }
  }

  function system(dt: number) {
    updateCollisions()
    updateDebugDraw(debugDraw)
  }

  targetEngine.addSystem(system, priority.TriggerSystemPriority)

  const triggersInterface = {
    addTrigger(
      entity: Entity,
      layerMask: number,
      triggeredByMask: number,
      areas?: Array<TriggerAreaSpec>,
      onEnterCallback?: OnTriggerEnterCallback,
      onExitCallback?: OnTriggerExitCallback,
      debugColor?: Color3
    ) {
      debugEntities.set(entity, [])
      activeCollisions.set(entity, new Set())
      triggerEnterCbs.set(entity, onEnterCallback)
      triggerExitCbs.set(entity, onExitCallback)

      if (!areas)
        areas = [{type: 'box'}]

      const boxAreas = []
      const sphereAreas = []

      for (const area of areas) {
        if (area.type == 'box') {
          boxAreas.push({
            position: area.position ? area.position : Vector3.Zero(),
            size: area.scale ? area.scale : Vector3.One()
          })
        } else {
          sphereAreas.push({
            position: area.position ? area.position : Vector3.Zero(),
            radius: area.radius ? area.radius : 1
          })
        }
      }

      Trigger.createOrReplace(entity, {
        active: true,
        layerMask: layerMask,
        triggeredByMask: triggeredByMask,
        boxAreas: boxAreas,
        sphereAreas: sphereAreas,
        debugColor: debugColor ? debugColor : Color3.Red()
      })
    },
    removeTrigger(entity: Entity) {
      const collisions = activeCollisions.get(entity)!
      const callback = triggerExitCbs.get(entity)
      
      for (const debugEntity of debugEntities.get(entity)!)
        targetEngine.removeEntity(debugEntity)

      debugEntities.delete(entity)
      activeCollisions.delete(entity)
      triggerEnterCbs.delete(entity)
      triggerExitCbs.delete(entity)
      Trigger.deleteFrom(entity)

      const collidingEntities = []
      for (const [otherEntity, otherEntityCollisions] of activeCollisions) {
        if (otherEntityCollisions.has(entity)) {
          otherEntityCollisions.delete(entity)
          collidingEntities.push(otherEntity)
        }
      }

      if (callback) {
        for (const collision of collisions)
          callback(collision)
      }

      for (const otherEntity of collidingEntities) {
        const callback = triggerExitCbs.get(otherEntity)
        if (callback)
          callback(entity)
      }
    },
    oneTimeTrigger(
      entity: Entity,
      layerMask: number,
      triggeredByMask: number,
      areas?: Array<TriggerAreaSpec>,
      onEnterCallback?: OnTriggerEnterCallback,
      debugColor?: Color3
    ) {
      this.addTrigger(entity, layerMask, triggeredByMask, areas, function(e) {
        triggers.removeTrigger(entity)
        if (onEnterCallback)
          onEnterCallback(e)
      }, undefined, debugColor)
    },
    enableTrigger(entity: Entity, enabled: boolean) {
      Trigger.getMutable(entity).active = enabled
    },
    isTriggerEnabled(entity: Entity) {
      return Trigger.get(entity).active
    },
    getLayerMask(entity: Entity) {
      return Trigger.get(entity).layerMask
    },
    setLayerMask(entity: Entity, mask: number) {
      Trigger.getMutable(entity).layerMask = mask
    },
    getTriggeredByMask(entity: Entity) {
      return Trigger.get(entity).triggeredByMask
    },
    setTriggeredByMask(entity: Entity, mask: number) {
      Trigger.getMutable(entity).triggeredByMask = mask
    },
    getBoxAreas(entity: Entity) {
      return Trigger.getMutable(entity).boxAreas
    },
    getSphereAreas(entity: Entity) {
      return Trigger.getMutable(entity).sphereAreas
    },
    setOnEnterCallback(entity: Entity, callback: OnTriggerEnterCallback) {
      triggerEnterCbs.set(entity, callback)
    },
    setOnExitCallback(entity: Entity, callback: OnTriggerExitCallback) {
      triggerExitCbs.set(entity, callback)
    },
    enableDebugDraw(enabled: boolean) {
      debugDraw = enabled
      if (!enabled) {
        for (const shapes of debugEntities.values()) {
          for (const shape of shapes)
            targetEngine.removeEntity(shape)
            shapes.length = 0
        }
      }
    },
    isDebugDrawEnabled() {
      return debugDraw
    }
  }

  triggersInterface.addTrigger(
    targetEngine.PlayerEntity, 1, 1,
    [{
      type: 'box',
      scale: {x: 0.65, y: 1.92, z: 0.65},
      position: {x: 0, y: 0.15, z: 0}
    }],
    undefined, undefined, Color3.Green()
  )

  return triggersInterface
}

export const triggers = createTriggers(engine)
