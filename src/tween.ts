import { engine, Entity, IEngine, TransformType, Schemas, Transform, EntityState } from '@dcl/sdk/ecs'
import { Scalar, Vector3, Quaternion } from '@dcl/sdk/math'
import { InterpolationType, interpolate } from './math'
import { priority } from './priority'

export type OnFinishCallback = () => void

export type Tweens = ReturnType<typeof createTweens>

function createTweens(targetEngine: IEngine) {
  const Vector3TweenSchema = {
    start: Schemas.Vector3,
    end: Schemas.Vector3,
    interpolationType: Schemas.EnumString(InterpolationType, InterpolationType.LINEAR),
    speed: Schemas.Float,
    normalizedTime: Schemas.Float
  }
  const PositionTween = targetEngine.defineComponent('dcl.utils.PositionTween', Vector3TweenSchema)
  const ScaleTween = targetEngine.defineComponent('dcl.utils.ScaleTween', Vector3TweenSchema)
  const RotationTween = targetEngine.defineComponent('dcl.utils.RotationTween', {
    start: Schemas.Quaternion,
    end: Schemas.Quaternion,
    interpolationType: Schemas.EnumString(InterpolationType, InterpolationType.LINEAR),
    speed: Schemas.Float,
    normalizedTime: Schemas.Float
  })

  type FinishCallbackMap = Map<Entity, OnFinishCallback | undefined>

  const positionFinishCbs: FinishCallbackMap = new Map()
  const rotationFinishCbs: FinishCallbackMap = new Map()
  const scaleFinishCbs: FinishCallbackMap = new Map()

  function makeSystem(
    tweenType: typeof PositionTween | typeof RotationTween,
    callbacks: FinishCallbackMap,
    transformer: (transform: TransformType, start: any, end: any, lerpTime: number) => void,
  ) {
    return function system(dt: number) {
      const deadTweens = []

      for (const entity of callbacks.keys()) {
        if (targetEngine.getEntityState(entity) == EntityState.Removed || !tweenType.has(entity)) {
          callbacks.delete(entity)
          continue
        }

        const tween = tweenType.getMutable(entity)
        tween.normalizedTime = Scalar.clamp(tween.normalizedTime + dt * tween.speed, 0, 1)
        const lerpTime = interpolate(tween.interpolationType, tween.normalizedTime)

        transformer(Transform.getMutable(entity), tween.start, tween.end, lerpTime)

        if (tween.normalizedTime >= 1)
          deadTweens.push(entity)
      }

      for (const entity of deadTweens) {
        const callback = callbacks.get(entity)
        tweenType.deleteFrom(entity)
        callbacks.delete(entity)
        if (callback)
          callback()
      }
    }
  }

  function makeStop(tweenType: typeof PositionTween | typeof RotationTween, callbacks: FinishCallbackMap) {
    return function(entity: Entity) {
      tweenType.deleteFrom(entity)
      callbacks.delete(entity)
    }
  }

  function makeStart<V>(tweenType: any, callbacks: FinishCallbackMap) {
    return function(
      entity: Entity,
      start: V,
      end: V,
      duration: number,
      interpolationType: InterpolationType = InterpolationType.LINEAR,
      onFinish?: OnFinishCallback
    ) {
      callbacks.set(entity, onFinish)
      tweenType.createOrReplace(entity, {
        start: start,
        end: end,
        speed: duration == 0 ? 0 : 1 / duration,
        interpolationType: interpolationType,
        normalizedTime: duration == 0 ? 1 : 0
      })      
    }
  }

  function makeGetOnFinishCallback(callbacks: FinishCallbackMap) {
    return function (entity: Entity) {
      if (!callbacks.has(entity))
        throw new Error(`Entity ${entity} is not registered with tweens system`)
      return callbacks.get(entity)
    }
  }

  targetEngine.addSystem(makeSystem(PositionTween, positionFinishCbs, function(transform, start, end, time) {
    transform.position = Vector3.lerp(start, end, time)
  }), priority.TweenSystemPriority)
  targetEngine.addSystem(makeSystem(RotationTween, rotationFinishCbs, function(transform, start, end, time) {
    transform.rotation = Quaternion.slerp(start, end, time)
  }), priority.TweenSystemPriority)
  targetEngine.addSystem(makeSystem(ScaleTween, scaleFinishCbs, function(transform, start, end, time) {
    transform.scale = Vector3.lerp(start, end, time)
  }), priority.TweenSystemPriority)

  return {
    startTranslation: makeStart<Vector3>(PositionTween, positionFinishCbs),
    stopTranslation: makeStop(PositionTween, positionFinishCbs),
    startRotation: makeStart<Quaternion>(RotationTween, rotationFinishCbs),
    stopRotation: makeStop(RotationTween, rotationFinishCbs),
    startScaling: makeStart<Vector3>(ScaleTween, scaleFinishCbs),
    stopScaling: makeStop(ScaleTween, scaleFinishCbs),
    getTranslationOnFinishCallback: makeGetOnFinishCallback(positionFinishCbs),
    getRotationOnFinishCallback: makeGetOnFinishCallback(rotationFinishCbs),
    getScalingOnFinishCallback: makeGetOnFinishCallback(scaleFinishCbs)
  }
}

export const tweens = createTweens(engine)
