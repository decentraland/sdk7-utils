import {
  EasingFunction,
  Entity,
  EntityState,
  QuaternionType,
  Vector3Type,
} from "@dcl/sdk/ecs";

import { priority } from "./priority";
import { getSDK } from "./sdk";
import { InterpolationType } from "./math";
import { getEasingFunctionFromInterpolation } from "./helpers";

export type OnFinishCallback = () => void;
type TweenMap = Map<
  Entity,
  {
    normalizedTime: number;
    callback: OnFinishCallback | undefined
  }
>

const tweenMap: TweenMap = new Map();
let tweenSystemStarted = false

export function initTweensSystem() {

  if (tweenSystemStarted) return
  tweenSystemStarted = true

  const {
    engine,
    components: { Tween }
  } = getSDK()


  function makeSystem(dt: number) {
    const deadTweens = [];

    for (const [entity, tweenData] of tweenMap.entries()) {
      if (
        engine.getEntityState(entity) == EntityState.Removed ||
        !Tween.has(entity)
      ) {
        tweenMap.delete(entity);
        continue;
      }

      const tween = Tween.get(entity);
      tweenData.normalizedTime += dt * 1000;

      if (tweenData.normalizedTime >= tween.duration) {
        deadTweens.push(entity);
      }
    }

    for (const entity of deadTweens) {
      const callback = tweenMap.get(entity)?.callback;
      Tween.deleteFrom(entity);
      tweenMap.delete(entity);
      if (callback) callback();
    }
  }

  engine.addSystem(makeSystem, priority.TweenSystemPriority);
}

function makeGetOnFinishCallback(entity: Entity) {
  if (!tweenMap.has(entity)) {
    throw new Error(`Entity ${entity} is not registered with tweens system`);
  }
  return tweenMap.get(entity);
}

export function getTranslationOnFinishCallback(entity: Entity) {
  makeGetOnFinishCallback(entity)
}

export function getRotationOnFinishCallback(entity: Entity) {
  makeGetOnFinishCallback(entity)
}

export function getScalingOnFinishCallback(entity: Entity) {
  makeGetOnFinishCallback(entity)
}

function makeStop(entity: Entity) {
  const { components: { Tween } } = getSDK()
  Tween.deleteFrom(entity);
  tweenMap.delete(entity);
}

export function startTranslation(entity: Entity, startPos: Vector3Type, endPos: Vector3Type, duration: number, interpolationType = InterpolationType.LINEAR, onFinish?: OnFinishCallback) {
  const { components: { Tween } } = getSDK()
  initTweensSystem()

  const currentTime = duration === 0 ? 1 : 0;
  tweenMap.set(entity, { normalizedTime: currentTime, callback: onFinish });
  Tween.createOrReplace(entity, {
    duration: duration * 1000,
    easingFunction: getEasingFunctionFromInterpolation(interpolationType),
    currentTime,
    mode: Tween.Mode.Move({ start: startPos, end: endPos }),
  })
}

export function startRotation(entity: Entity, startPos: QuaternionType, endPos: QuaternionType, duration: number, interpolationType = InterpolationType.LINEAR, onFinish?: OnFinishCallback) {
  const { components: { Tween } } = getSDK()
  initTweensSystem()

  const currentTime = duration === 0 ? 1 : 0;
  tweenMap.set(entity, { normalizedTime: currentTime, callback: onFinish });
  Tween.createOrReplace(entity, {
    duration: duration * 1000,
    easingFunction: getEasingFunctionFromInterpolation(interpolationType),
    currentTime,
    mode: Tween.Mode.Rotate({ start: startPos, end: endPos }),
  })
}

export function startScaling(entity: Entity, startPos: Vector3Type, endPos: Vector3Type, duration: number, interpolationType = InterpolationType.LINEAR, onFinish?: OnFinishCallback) {
  const { components: { Tween } } = getSDK()
  initTweensSystem()

  const currentTime = duration === 0 ? 1 : 0;
  tweenMap.set(entity, { normalizedTime: currentTime, callback: onFinish });
  Tween.createOrReplace(entity, {
    duration: duration * 1000,
    easingFunction: getEasingFunctionFromInterpolation(interpolationType),
    currentTime,
    mode: Tween.Mode.Scale({ start: startPos, end: endPos }),
  })
}

export function stopTranslation(entity: Entity) {
  makeStop(entity)
}

export function stopRotation(entity: Entity) {
  makeStop(entity)
}

export function stopScaling(entity: Entity) {
  makeStop(entity)
}
