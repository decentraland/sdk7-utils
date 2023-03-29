import { engine, Entity, IEngine, Schemas, Transform } from '@dcl/sdk/ecs'
import { Scalar, Vector3, Quaternion } from '@dcl/sdk/math'
import { createCatmullRomSpline } from './math'
import { priority } from './priority'

export type Paths = ReturnType<typeof createPaths>

export type OnFinishCallback = () => void
export type OnPointReachedCallback = (pointIndex: number, point: Vector3, nextPoint: Vector3) => void

function createPaths(targetEngine: IEngine) {
  const FollowPath = targetEngine.defineComponent('dcl.utils.FollowPath', {
    points: Schemas.Array(Schemas.Vector3),
    speed: Schemas.Array(Schemas.Number),
    faceDirection: Schemas.Boolean,
    normalizedTime: Schemas.Number,
    currentIndex: Schemas.Number
  })

  type FinishCallbackMap = Map<Entity, OnFinishCallback | undefined>
  type OnPointReachedCallbackMap = Map<Entity, OnPointReachedCallback | undefined>

  const finishCbs: FinishCallbackMap = new Map()
  const pointReachedCbs: OnPointReachedCallbackMap = new Map()

  function system(dt: number) {
    const deadPaths = []
    const pointReachedPaths = []

    for (const [entity] of targetEngine.getEntitiesWith(FollowPath, Transform)) {
      const path = FollowPath.getMutable(entity)
      path.normalizedTime = Scalar.clamp(path.normalizedTime + dt * path.speed[path.currentIndex], 0, 1)
      const transform = Transform.getMutable(entity)
      transform.position = Vector3.lerp(
        path.points[path.currentIndex],
        path.points[path.currentIndex + 1],
        path.normalizedTime
      )
      
      if (path.normalizedTime >= 1) {
        if (path.currentIndex < path.points.length - 2) {
          if (path.faceDirection) {
            const direction = Vector3.subtract(path.points[path.currentIndex + 2], path.points[path.currentIndex + 1])
            transform.rotation = Quaternion.lookRotation(direction)
          }
          path.currentIndex++
          path.normalizedTime = 0
          if (path.currentIndex < path.points.length - 1) {
            pointReachedPaths.push(entity)
          }
        } else {
          deadPaths.push(entity)
        }
      }
    }

    for (const entity of pointReachedPaths) {
      const callback = pointReachedCbs.get(entity)
      if (callback) {
        const path = FollowPath.get(entity)
        callback(path.currentIndex, path.points[path.currentIndex], path.points[path.currentIndex + 1])
      }
    }

    for (const entity of deadPaths) {
      const callback = finishCbs.get(entity)
      finishCbs.delete(entity)
      FollowPath.deleteFrom(entity)
      if (callback)
        callback()
    }
  }

  targetEngine.addSystem(system, priority.PathSystemPriority)

  function startPath(
    entity: Entity,
    points: Vector3[],
    duration: number,
    faceDirection?: boolean,
    curveSegmentNumber?: number,
    loop?: boolean,
    onFinishCallback?: OnFinishCallback,
    onPointReachedCallback?: OnPointReachedCallback
  ) {
    if (points.length < 2)
      throw new Error('At least 2 points are required to form a path.')

    if (duration == 0)
      throw new Error('Path duration must not be zero')

    if (curveSegmentNumber) {
      if (loop)
        points.unshift(points.pop()!)

      points = createCatmullRomSpline(
        points,
        curveSegmentNumber,
        loop ? true : false
      )
    } else {
      if (loop)
        points.push(points[0])
    }

    finishCbs.set(entity, onFinishCallback)
    pointReachedCbs.set(entity, onPointReachedCallback)

    const speeds = []
    let totalDist = 0
    const pointsDist = []
    for (let i = 0; i < points.length - 1; i++) {
      let sqDist = Vector3.distance(points[i], points[i + 1])
      totalDist += sqDist
      pointsDist.push(sqDist)
    }
    for (let i = 0; i < pointsDist.length; i++) {
      speeds.push(1 / ((pointsDist[i] / totalDist) * duration))
    }

    FollowPath.createOrReplace(entity, {
      points: points,
      speed: speeds,
      normalizedTime: 0,
      currentIndex: 0,
      faceDirection: faceDirection
    })

    if (faceDirection) {
      const direction = Vector3.subtract(points[1], points[0])
      Transform.getMutable(entity).rotation = Quaternion.lookRotation(direction)
    }
  }

  return {
    startStraightPath(
      entity: Entity,
      points: Vector3[],
      duration: number,
      loop?: boolean,
      faceDirection?: boolean,
      onFinishCallback?: OnFinishCallback,
      onPointReachedCallback?: OnPointReachedCallback
    ) {
      return startPath(entity, points, duration, faceDirection, 0, loop, onFinishCallback, onPointReachedCallback)
    },
    startCurvedPath(
      entity: Entity,
      points: Vector3[],
      duration: number,
      curveSegmentNumber: number,
      loop?: boolean,
      faceDirection?: boolean,
      onFinishCallback?: OnFinishCallback
    ) {
      return startPath(entity, points, duration, faceDirection, curveSegmentNumber, loop, onFinishCallback)
    },
    stopPath(entity: Entity) {
      const callback = finishCbs.get(entity)
      finishCbs.delete(entity)
      pointReachedCbs.delete(entity)
      FollowPath.deleteFrom(entity)
      if (callback)
        callback()
    }
  }
}

export const paths = createPaths(engine)
