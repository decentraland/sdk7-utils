import { createInputSystem, IEngine, IInputSystem, createTweenSystem, TweenSystem, createPointerEventsSystem, PointerEventsSystem } from '@dcl/sdk/ecs'
import * as components from '@dcl/ecs/dist/components'

type ICache = {
  engine: IEngine
  inputSystem: IInputSystem
  tweenSystem: TweenSystem
  pointerEventsSystem: PointerEventsSystem
  
  components: {
    Transform: ReturnType<typeof components.Transform>
    GltfContainer: ReturnType<typeof components.GltfContainer>
    AudioSource: ReturnType<typeof components.AudioSource>
    Material: ReturnType<typeof components.Material>
    MeshRenderer: ReturnType<typeof components.MeshRenderer>
    MeshCollider: ReturnType<typeof components.MeshCollider>
    VisibilityComponent: ReturnType<typeof components.VisibilityComponent>
    TextShape: ReturnType<typeof components.TextShape>
    PointerEvents: ReturnType<typeof components.PointerEvents>
    Billboard: ReturnType<typeof components.Billboard>
    Tween: ReturnType<typeof components.Tween>
    TweenSequence: ReturnType<typeof components.TweenSequence>
    TweenState: ReturnType<typeof components.TweenState>
    PlayerIdentityData: ReturnType<typeof components.PlayerIdentityData>
    RealmInfo: ReturnType<typeof components.RealmInfo>
  }
}

const cache: ICache = {} as ICache

/**
 * @internal
 */
export function setSDK(value: Omit<ICache, 'inputSystem' | 'components' | 'tweenSystem' | 'pointerEventsSystem'>) {
  for (const key in value) {
    ;(cache as any)[key] = (value as any)[key]
  }

  cache.inputSystem = createInputSystem(value.engine)
  cache.tweenSystem = createTweenSystem(value.engine)
  cache.pointerEventsSystem = createPointerEventsSystem(value.engine, cache.inputSystem)

  cache.components = {
      Transform: components.Transform(cache.engine),
      GltfContainer: components.GltfContainer(cache.engine),
      AudioSource: components.AudioSource(cache.engine),
      Material: components.Material(cache.engine),
      MeshRenderer: components.MeshRenderer(cache.engine),
      MeshCollider: components.MeshCollider(cache.engine),
      VisibilityComponent: components.VisibilityComponent(cache.engine),
      TextShape: components.TextShape(cache.engine),
      PointerEvents: components.PointerEvents(cache.engine),
      Billboard: components.Billboard(cache.engine),
      Tween: components.Tween(cache.engine),
      TweenSequence: components.TweenSequence(cache.engine),
      TweenState: components.TweenState(cache.engine),
      PlayerIdentityData: components.PlayerIdentityData(cache.engine),
      RealmInfo: components.RealmInfo(cache.engine)
  }
}

/**
 * @internal
 */
export function getSDK() {
  if (!cache.engine) throw new Error('Call init library first.')
  return { ...cache }
}
