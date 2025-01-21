import { engine, Entity, EntityState, IEngine, ISchema, MapComponentDefinition, MapResult, Schemas } from '@dcl/sdk/ecs'
import * as timers from './timer';
import { getSDK } from './sdk';

export enum ToggleState {
  Off = 0,
  On = 1
}

export type ToggleCallback = (state: ToggleState) => void

export type Toggles = ReturnType<typeof initToggles>

let Toggle: ReturnType<typeof engine.defineComponent>

let toggles: Map<Entity, ToggleCallback | undefined> = new Map()

let togglesSystemStarted = false

function initToggles() {
  if (togglesSystemStarted) return
  togglesSystemStarted = true

  const { engine } = getSDK()
  
  Toggle = engine.defineComponent('dcl.utils.Toggle', {
    state: Schemas.EnumNumber(ToggleState, ToggleState.Off)
  })
  

  timers.setInterval(function () {
    for (const entity of toggles.keys()) {
      if (engine.getEntityState(entity) == EntityState.Removed || !Toggle.has(entity)) {
        toggles.delete(entity)
      }
    }
  }, 5000)

}

export function addToggle(entity: Entity, state: ToggleState, callback ?: ToggleCallback) {
  initToggles()

  toggles.set(entity, callback)
  Toggle.createOrReplace(entity, { state: state })
}

export function removeToggle(entity: Entity) {
  initToggles()

  toggles.delete(entity)
  Toggle.deleteFrom(entity)
}

export function setCallback(entity: Entity, callback?: ToggleCallback) {
  initToggles()

  toggles.set(entity, callback)
}

export function set(entity: Entity, state: ToggleState) {
  initToggles()

  const oldState = Toggle.get(entity).state
  if (oldState != state) {
    Toggle.getMutable(entity).state = state
    const callback = toggles.get(entity)
    if (callback)
      callback(state)
  }
}

export function flip(entity: Entity) {
  initToggles()

  set(entity, 1 - Toggle.get(entity).state)
}

export function isOn(entity: Entity) {
  initToggles()

  return Toggle.get(entity).state == ToggleState.On
}
