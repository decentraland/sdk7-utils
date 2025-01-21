import { Entity, EntityState, ISchema, MapComponentDefinition, MapResult, Schemas, Vector3Type } from '@dcl/sdk/ecs'
import { Scalar, Vector3, Quaternion } from '@dcl/sdk/math'
import { createCatmullRomSpline } from './math'
import { priority } from './priority'
import { getSDK } from './sdk'

export type Paths = ReturnType<typeof initPaths>

export type OnFinishCallback = () => void
export type OnPointReachedCallback = (pointIndex: number, point: Vector3, nextPoint: Vector3) => void
let pathSystemStarted = false

type FinishCallbackMap = Map<Entity, OnFinishCallback | undefined>
type OnPointReachedCallbackMap = Map<Entity, OnPointReachedCallback | undefined>

let FollowPath: MapComponentDefinition<MapResult<{ points: ISchema<Vector3Type[]>; faceDirection: ISchema<boolean>; speed: ISchema<number>; normalizedTime: ISchema<number>; currentIndex: ISchema<number>; segmentTimes: ISchema<number[]>; curveSegmentCount: ISchema<number> }>>

const finishCbs: FinishCallbackMap = new Map()
const pointReachedCbs: OnPointReachedCallbackMap = new Map()



function initPaths() {
  if (pathSystemStarted) return
  pathSystemStarted = true

  const { engine } = getSDK()

  FollowPath = engine.defineComponent('dcl.utils.FollowPath', {
    points: Schemas.Array(Schemas.Vector3),
    faceDirection: Schemas.Boolean,
    speed: Schemas.Number,
    normalizedTime: Schemas.Number,
    currentIndex: Schemas.Number,
    segmentTimes: Schemas.Array(Schemas.Number),
    curveSegmentCount: Schemas.Number
  })

  function system(dt: number) {
    const { components: { Transform } } = getSDK()

    const deadPaths = []
    const pointReachedPaths = []

    for (const entity of finishCbs.keys()) {
      if (engine.getEntityState(entity) == EntityState.Removed || !FollowPath.has(entity)) {
        stopPath(entity)
        continue
      }

      const transform = Transform.getMutable(entity)
      const path = FollowPath.getMutable(entity)
      path.normalizedTime = Scalar.clamp(path.normalizedTime + dt * path.speed, 0, 1)
      if (path.normalizedTime >= 1)
        deadPaths.push(entity)

      while (
        path.normalizedTime >= path.segmentTimes[path.currentIndex] &&
        path.currentIndex < path.points.length - 1
      ) {
        if (path.faceDirection) {
          const direction = Vector3.subtract(path.points[path.currentIndex + 1], path.points[path.currentIndex])
          transform.rotation = Quaternion.lookRotation(direction)
        }
        if (path.currentIndex > 0 && path.currentIndex % path.curveSegmentCount == 0) {
          const pointIndex = path.currentIndex / path.curveSegmentCount
          const pointCoords = path.points[path.currentIndex]
          const nextPointCoords = path.points[path.currentIndex + path.curveSegmentCount]
          pointReachedPaths.push({ entity: entity, index: pointIndex, coords: pointCoords, nextCoords: nextPointCoords })
        }
        path.currentIndex += 1
      }

      const timeDiff = path.segmentTimes[path.currentIndex] - path.segmentTimes[path.currentIndex - 1]
      const coef = (path.segmentTimes[path.currentIndex] - path.normalizedTime) / timeDiff
      transform.position = Vector3.lerp(path.points[path.currentIndex], path.points[path.currentIndex - 1], coef)
    }

    for (const pointReached of pointReachedPaths) {
      const callback = pointReachedCbs.get(pointReached.entity)
      if (callback) {
        callback(pointReached.index, pointReached.coords, pointReached.nextCoords)
      }
    }

    for (const entity of deadPaths) {
      const callback = finishCbs.get(entity)
      stopPath(entity)
      if (callback)
        callback()
    }
  }

  engine.addSystem(system, priority.PathSystemPriority)

}


export function stopPath(entity: Entity) {
  initPaths()

  finishCbs.delete(entity)
  pointReachedCbs.delete(entity)
  FollowPath.deleteFrom(entity)
}

function startPath(
  entity: Entity,
  points: Vector3[],
  duration: number,
  faceDirection?: boolean,
  curveSegmentCount?: number,
  onFinishCallback?: OnFinishCallback,
  onPointReachedCallback?: OnPointReachedCallback
) {
  if (points.length < 2)
    throw new Error('At least 2 points are required to form a path.')

  if (duration == 0)
    throw new Error('Path duration must not be zero')

  if (curveSegmentCount) {
    const loop = Vector3.equals(points[0], points[points.length - 1])
    if (loop) {
      points.pop()
      points.unshift(points.pop()!)
    }
    points = createCatmullRomSpline(points, curveSegmentCount, loop)
  } else {
    curveSegmentCount = 1
  }

  finishCbs.set(entity, onFinishCallback)
  pointReachedCbs.set(entity, onPointReachedCallback)

  let totalLength = 0
  const segmentLengths = []
  for (let i = 0; i < points.length - 1; i++) {
    let sqDist = Vector3.distance(points[i], points[i + 1])
    totalLength += sqDist
    segmentLengths.push(sqDist)
  }

  const segmentTimes = [0]
  for (let i = 0; i < segmentLengths.length; i++) {
    segmentTimes.push(segmentLengths[i] / totalLength + segmentTimes[i])
  }

  FollowPath.createOrReplace(entity, {
    points: points,
    segmentTimes: segmentTimes,
    curveSegmentCount: curveSegmentCount,
    speed: 1 / duration,
    normalizedTime: 0,
    currentIndex: 0,
    faceDirection: faceDirection
  })
}

export function startStraightPath(
  entity: Entity,
  points: Vector3[],
  duration: number,
  faceDirection?: boolean,
  onFinishCallback?: OnFinishCallback,
  onPointReachedCallback?: OnPointReachedCallback
) {
  initPaths()
  return startPath(entity, points, duration, faceDirection, 0, onFinishCallback, onPointReachedCallback)
}

export function startSmoothPath(
  entity: Entity,
  points: Vector3[],
  duration: number,
  segmentCount: number,
  faceDirection?: boolean,
  onFinishCallback?: OnFinishCallback,
  onPointReachedCallback?: OnPointReachedCallback
) {
  initPaths()
  if (segmentCount < 2 || !Number.isInteger(segmentCount))
    throw new Error(`segmentCount must be an integer that is greater than 2, got: ${segmentCount}`)
  return startPath(entity, points, duration, faceDirection, segmentCount, onFinishCallback, onPointReachedCallback)
}

export function getOnFinishCallback(entity: Entity) {
  if (!finishCbs.has(entity))
    throw new Error(`Entity ${entity} is not registered in triggers system`)
  return finishCbs.get(entity)
}
