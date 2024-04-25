import { AudioSource, Entity, EntityState, IEngine, PBAudioSource, engine } from "@dcl/sdk/ecs";
import { priority } from "./priority";

export type Sounds = ReturnType<typeof createSounds>

function assertSound(start: number, end: number) {
  if (start < 0) {
    throw new Error('Invalid "start" parameter provided. "start" parameter should be >= 0.')
  }

  if (start >= end) {
    throw new Error('Invalid "start" & "end" parameters provided. "start" parameter should be lower than "end" parameter.')
  }
}

function createSounds(targetEngine: IEngine) {
  const soundMap = new Map<Entity, { currentTime: number; end: number; }>()

  function makeSystem(dt: number) {
    const deadSounds = [];

    for (const [entity, soundData] of soundMap.entries()) {
      if (
        targetEngine.getEntityState(entity) == EntityState.Removed ||
        !AudioSource.has(entity)
      ) {
        soundMap.delete(entity);
        continue;
      }

      soundData.currentTime += dt;

      if (soundData.currentTime >= soundData.end) {
        deadSounds.push(entity);
      }
    }

    for (const entity of deadSounds) {
      AudioSource.stopSound(entity)
      soundMap.delete(entity);
    }
  }

  function playSoundSegment(entity: Entity, value: PBAudioSource, start: number, end: number) {
    assertSound(start, end)

    soundMap.set(entity, { currentTime: start, end })
    AudioSource.createOrReplace(entity, {
      ...value,
      playing: true,
      currentTime: start
    })
  }

  targetEngine.addSystem(makeSystem, priority.TweenSystemPriority)

  return {
    playSoundSegment,
  }
}

export const sounds = createSounds(engine)
