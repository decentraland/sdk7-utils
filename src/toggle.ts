import { engine, Entity, EntityState, IEngine, Schemas } from '@dcl/sdk/ecs'
import { timers, Timers } from './timer';

export enum ToggleState {
  Off = 0,
  On = 1
}

export type ToggleCallback = (state: ToggleState) => void

export type Toggles = ReturnType<typeof createToggles>

function createToggles(targetEngine: IEngine, timers: Timers) {
  const Toggle = targetEngine.defineComponent('dcl.utils.Toggle', {
    state: Schemas.EnumNumber(ToggleState, ToggleState.Off)
  })

  let toggles: Map<Entity, ToggleCallback | undefined> = new Map();

  timers.setInterval(function () {
    for (const entity of toggles.keys()) {
      if (targetEngine.getEntityState(entity) == EntityState.Removed || !Toggle.has(entity)) {
        toggles.delete(entity)
      }
    }
  }, 5000)

  return {
    addToggle(entity: Entity, state: ToggleState, callback?: ToggleCallback) {
      toggles.set(entity, callback)
      Toggle.createOrReplace(entity, {state: state})
    },
    removeToggle(entity: Entity) {
      toggles.delete(entity)
      Toggle.deleteFrom(entity)
    },
    setCallback(entity: Entity, callback?: ToggleCallback) {
      toggles.set(entity, callback)
    },
    set(entity: Entity, state: ToggleState) {
      const oldState = Toggle.get(entity).state
      if (oldState != state) {
        Toggle.getMutable(entity).state = state
        const callback = toggles.get(entity)
        if (callback)
          callback(state)
      }
    },
    flip(entity: Entity) {
      this.set(entity, 1 - Toggle.get(entity).state)      
    },
    isOn(entity: Entity) {
      return Toggle.get(entity).state == ToggleState.On
    }
  }
}

export const toggles = createToggles(engine, timers)
