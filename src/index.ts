import { IEngine } from '@dcl/sdk/ecs'
import { setSDK } from './sdk'
  
  export let engine: IEngine
  
  export function initLibrary(
	engine: IEngine,
  ) {
	setSDK({ engine })
  }
  
export {
	InterpolationType,
	remap,
	interpolate,
	getWorldPosition,
	getWorldRotation
} from './math'

export {
	addLabel,
	addTestCube
} from './debug'

export * as toggles from './toggle'

export * as tweens from './tween'

export * as audio from './audio'

export * as perpetualMotions from './perpetualMotion'

export * as paths from './path'

export * as triggers from './trigger'

export * as timers from './timer'

export {
	actions
} from './action'

export {
	priority
} from './priority'

export {
	getEntitiesWithParent,
	getEntityParent,
	getPlayerPosition,
	playSound,
	getEasingFunctionFromInterpolation
} from './helpers'
