import {
  engine,
  Entity,
  IEngine,
  EntityState,
  Tween,
  TweenHelper,
} from "@dcl/sdk/ecs";

import { priority } from "./priority";
import { InterpolationType } from "./math";
import { getEasingFunctionFromInterpolation } from "./helpers";

export type OnFinishCallback = () => void;
export type Tweens = ReturnType<typeof createTweens>;
type TweenMap = Map<
  Entity,
  {
    normalizedTime: number;
    callback: OnFinishCallback | undefined;
  }
>;

function createTweens(targetEngine: IEngine) {
  const tweenMap: TweenMap = new Map();

  function makeSystem(dt: number) {
    const deadTweens = [];

    for (const [entity, tweenData] of tweenMap.entries()) {
      if (
        targetEngine.getEntityState(entity) == EntityState.Removed ||
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

  function makeStop(entity: Entity) {
    Tween.deleteFrom(entity);
    tweenMap.delete(entity);
  }

  function makeStart<Mode extends keyof TweenHelper>(mode: Mode) {
    return function (
      entity: Entity,
      start: any,
      end: any,
      duration: number,
      interpolationType: InterpolationType = InterpolationType.LINEAR,
      onFinish?: OnFinishCallback
    ) {
      const currentTime = duration === 0 ? 1 : 0;
      tweenMap.set(entity, { normalizedTime: currentTime, callback: onFinish });
      const modeValue = (Tween.Mode as any)[mode]({ start: start as any, end: end as any })
      Tween.createOrReplace(entity, {
        duration: duration * 1000,
        easingFunction: getEasingFunctionFromInterpolation(interpolationType),
        currentTime,
        mode: modeValue,
      });
    };
  }

  function makeGetOnFinishCallback(entity: Entity) {
    if (!tweenMap.has(entity)) {
      throw new Error(`Entity ${entity} is not registered with tweens system`);
    }
    return tweenMap.get(entity);
  }

  targetEngine.addSystem(makeSystem, priority.TweenSystemPriority);

  return {
    startTranslation: makeStart("Move"),
    stopTranslation: makeStop,
    startRotation: makeStart("Rotate"),
    stopRotation: makeStop,
    startScaling: makeStart("Scale"),
    stopScaling: makeStop,
    getTranslationOnFinishCallback: makeGetOnFinishCallback,
    getRotationOnFinishCallback: makeGetOnFinishCallback,
    getScalingOnFinishCallback: makeGetOnFinishCallback,
  };
}

export const tweens = createTweens(engine);
