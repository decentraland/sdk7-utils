import { AudioSource, Entity, EntityState, IEngine, PBAudioSource, engine } from "@dcl/sdk/ecs";
import { priority } from "./priority";

function getAudioDuration(audio: HTMLAudioElement): Promise<number> {
  return new Promise((resolve, reject) => {
    let loaded: boolean = false
    const error = new Error('Failed getting sound duration')

    const timeout = setTimeout(() => {
      if (!loaded) reject(error)
      audio.removeEventListener("error", onError)
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
    }, 100)

    function onError() {
      clearTimeout(timeout)
      reject(error)
    }

    function onLoadedMetadata() {
      loaded = true
      resolve(audio.duration)
    }

    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("error", onError)
  })
}

function assertSound(start: number, end: number, duration: number) {
  if (start < 0) {
    throw new Error('Invalid "start" parameter provided. "start" parameter should be >= 0.')
  }

  if (start >= end) {
    throw new Error('Invalid "start" & "end" parameters provided. "start" parameter should be lower than "end" parameter.')
  }

  if (end > duration) {
    throw new Error('Invalid "end" & "duration" parameters provided. "end" parameter should be lower than the duration of the sound.')
  }
}

function createSounds(targetEngine: IEngine) {
  const soundMap = new Map<Entity, { currentTime: number; end: number; duration: number; }>()

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
    const audio = new Audio(value.audioClipUrl)
    getAudioDuration(audio)
      .then(duration => {
        assertSound(start, end, duration)

        soundMap.set(entity, { currentTime: start, end, duration })
        AudioSource.createOrReplace(entity, {
          ...value,
          playing: true,
          currentTime: start
        })
      })
      .catch((e) => console.error(e))
  }

  targetEngine.addSystem(makeSystem, priority.TweenSystemPriority)

  return {
    playSoundSegment,
  }
}

export const sounds = createSounds(engine)
