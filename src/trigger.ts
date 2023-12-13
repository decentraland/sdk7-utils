import { engine, Entity, IEngine, MeshRenderer, Schemas, Transform, Material, DeepReadonly, EntityState } from '@dcl/sdk/ecs'
import { Vector3, Color4, Color3 } from '@dcl/sdk/math'
import { getWorldPosition, getWorldRotation, areAABBIntersecting, areAABBSphereIntersecting, areSpheresIntersecting } from './math'
import { priority } from './priority'

export const LAYER_1 = 1
export const LAYER_2 = 2
export const LAYER_3 = 4
export const LAYER_4 = 8
export const LAYER_5 = 16
export const LAYER_6 = 32
export const LAYER_7 = 64
export const LAYER_8 = 128
export const ALL_LAYERS = 255
export const NO_LAYERS = 0

export let PLAYER_LAYER_ID = LAYER_1

export type TriggerBoxAreaSpec = {
	type: 'box',
	position?: Vector3,
	scale?: Vector3
}
export type TriggerSphereAreaSpec = {
	type: 'sphere',
	position?: Vector3,
	radius?: number
}
export type TriggerAreaSpec = TriggerBoxAreaSpec | TriggerSphereAreaSpec

export type TriggerBoxArea = {
	position: Vector3,
	scale: Vector3
}
export type TriggerSphereArea = {
	position: Vector3,
	radius: number
}
export type TriggerArea = { $case: 'box', value: TriggerBoxArea } | { $case: 'sphere', value: TriggerSphereArea }

type OnTriggerEnterCallback = (entity: Entity) => void
type OnTriggerExitCallback = (entity: Entity) => void

export type Triggers = ReturnType<typeof createTriggers>

function createTriggers(targetEngine: IEngine) {
	const Trigger = engine.defineComponent('dcl.utils.Trigger', {
		active: Schemas.Boolean,
		layerMask: Schemas.Int,
		triggeredByMask: Schemas.Int,
		areas: Schemas.Array(Schemas.OneOf({
			box: Schemas.Map({
				position: Schemas.Vector3,
				scale: Schemas.Vector3
			}),
			sphere: Schemas.Map({
				position: Schemas.Vector3,
				radius: Schemas.Number
			})
		})),
		debugColor: Schemas.Color3
	})

	type TriggerType = {
		active: boolean,
		layerMask: number,
		triggeredByMask: number,
		areas: Array<TriggerArea>,
		debugColor: Color3
	}

	const triggerEnterCbs: Map<Entity, OnTriggerEnterCallback | undefined> = new Map()
	const triggerExitCbs: Map<Entity, OnTriggerExitCallback | undefined> = new Map()

	let debugDraw = false
	const activeCollisions: Map<Entity, Set<Entity>> = new Map()
	const debugEntities: Map<Entity, Array<Entity>> = new Map()

	function updateDebugDraw(enabled: boolean) {
		if (!enabled)
			return

		for (const [entity, trigger] of targetEngine.getEntitiesWith(Trigger, Transform)) {
			let shapes = debugEntities.get(entity)!

			const areaCount = trigger.areas.length
			while (shapes.length > areaCount) {
				targetEngine.removeEntity(shapes.pop()!)
			}
			while (shapes.length < areaCount) {
				shapes.push(targetEngine.addEntity())
			}

			const worldPosition = getWorldPosition(entity)
			const worldRotation = getWorldRotation(entity)

			for (let i = 0; i < areaCount; ++i) {
				const shapeSpec = trigger.areas[i]
				const shape = shapes[i]

				let scale
				if (shapeSpec.$case == 'box') {
					scale = shapeSpec.value.scale
					MeshRenderer.setBox(shape)
				} else {
					const radius = shapeSpec.value.radius
					scale = { x: radius, y: radius, z: radius }
					MeshRenderer.setSphere(shape)
				}

				Transform.createOrReplace(shape, {
					position: Vector3.add(worldPosition, Vector3.rotate(shapeSpec.value.position, worldRotation)),
					scale: scale
				})

				const color = trigger.active ? trigger.debugColor : Color3.Black()
				Material.setPbrMaterial(shape, { albedoColor: Color4.fromInts(255 * color.r, 255 * color.g, 255 * color.b, 75) })
			}
		}
	}

	function areTriggersIntersecting(
		shapeWorldPos0: Array<Vector3>,
		t0: DeepReadonly<TriggerType>,
		shapeWorldPos1: Array<Vector3>,
		t1: DeepReadonly<TriggerType>
	): boolean {
		for (let i = 0; i < t0.areas.length; ++i) {
			const t0World = shapeWorldPos0[i]
			const t0Area = t0.areas[i]

			if (t0Area.$case == 'box') {
				const t0Box = t0Area.value
				const t0Min = Vector3.subtract(t0World, Vector3.scale(t0Box.scale, 0.5))
				const t0Max = Vector3.add(t0Min, t0Box.scale)

				for (let j = 0; j < t1.areas.length; ++j) {
					const t1World = shapeWorldPos1[j]
					const t1Area = t1.areas[j]

					if (t1Area.$case == 'box') {
						const t1Box = t1Area.value
						const t1Min = Vector3.subtract(t1World, Vector3.scale(t1Box.scale, 0.5))
						const t1Max = Vector3.add(t1Min, t1Box.scale)

						if (areAABBIntersecting(t0Min, t0Max, t1Min, t1Max))
							return true
					} else {
						if (areAABBSphereIntersecting(t0Min, t0Max, t1World, t1Area.value.radius))
							return true
					}
				}
			} else {
				const t0Radius = t0Area.value.radius

				for (let j = 0; j < t1.areas.length; ++j) {
					const t1World = shapeWorldPos1[j]
					const t1Area = t1.areas[j]

					if (t1Area.$case == 'box') {
						const t1Box = t1Area.value
						const t1Min = Vector3.subtract(t1World, Vector3.scale(t1Box.scale, 0.5))
						const t1Max = Vector3.add(t1Min, t1Box.scale)

						if (areAABBSphereIntersecting(t1Min, t1Max, t0World, t0Radius))
							return true
					} else {
						if (areSpheresIntersecting(t0World, t0Radius, t1World, t1Area.value.radius))
							return true
					}
				}
			}
		}

		return false
	}

	function computeCollisions(entity: Entity, shapeWorldPos: Map<Entity, Array<Vector3>>) {
		let collisions: Set<Entity> = EMPTY_IMMUTABLE_SET
		const trigger = Trigger.get(entity)

		if (!trigger.active)
			return collisions


		if (trigger.triggeredByMask == PLAYER_LAYER_ID) {
			// check just player 
			const playerEntity = targetEngine.PlayerEntity
			const playerTrigger = Trigger.get(targetEngine.PlayerEntity)

			if (playerEntity == entity)
				return collisions

			if (!playerTrigger.active)
				return collisions

			if (!(trigger.triggeredByMask & playerTrigger.layerMask))
				return collisions

			const intersecting = areTriggersIntersecting(shapeWorldPos.get(entity)!, trigger, shapeWorldPos.get(playerEntity)!, playerTrigger)
			if (intersecting) {
				if (collisions === EMPTY_IMMUTABLE_SET) collisions = new Set()
				collisions.add(playerEntity)
			}
		} else {
			// iterate over full list of triggers
			for (const [otherEntity, otherTrigger] of targetEngine.getEntitiesWith(Trigger, Transform)) {
				if (otherEntity == entity)
					continue

				if (!otherTrigger.active)
					continue

				if (!(trigger.triggeredByMask & otherTrigger.layerMask))
					continue

				const intersecting = areTriggersIntersecting(shapeWorldPos.get(entity)!, trigger, shapeWorldPos.get(otherEntity)!, otherTrigger)
				if (intersecting) {
					if (collisions === EMPTY_IMMUTABLE_SET) collisions = new Set()
					collisions.add(otherEntity)
				}
				if (collisions === EMPTY_IMMUTABLE_SET) collisions = new Set()
				collisions.add(otherEntity)
			}
		}




		return collisions
	}

	function updateCollisions() {
		const collisionsStarted = []
		const collisionsEnded = []
		const shapeWorldPositions: Map<Entity, Array<Vector3>> = new Map()

		for (const entity of activeCollisions.keys()) {
			if (targetEngine.getEntityState(entity) == EntityState.Removed || !Trigger.has(entity)) {
				for (const debugEntity of debugEntities.get(entity)!)
					targetEngine.removeEntity(debugEntity)

				for (const collisions of activeCollisions.values()) {
					if (collisions.has(entity))
						collisions.delete(entity)
				}

				debugEntities.delete(entity)
				activeCollisions.delete(entity)
				triggerEnterCbs.delete(entity)
				triggerExitCbs.delete(entity)
				continue
			}

			const positions = []
			const entityWorldPosition = getWorldPosition(entity)
			const entityWorldRotation = getWorldRotation(entity)
			const trigger = Trigger.get(entity)

			for (const shape of trigger.areas) {
				positions.push(Vector3.add(entityWorldPosition, Vector3.rotate(shape.value.position, entityWorldRotation)))
			}
			shapeWorldPositions.set(entity, positions)
		}

		for (const entity of activeCollisions.keys()) {
			const newCollisions = computeCollisions(entity, shapeWorldPositions)
			const oldCollisions = activeCollisions.get(entity)!

			for (const oldCollision of oldCollisions) {
				if (!newCollisions.has(oldCollision))
					collisionsEnded.push([entity, oldCollision])
			}

			for (const newCollision of newCollisions) {
				if (!oldCollisions.has(newCollision))
					collisionsStarted.push([entity, newCollision])
			}

			activeCollisions.set(entity, newCollisions)
		}

		for (const [entity, collision] of collisionsStarted) {
			const callback = triggerEnterCbs.get(entity)
			if (callback)
				callback(collision)
		}

		for (const [entity, collision] of collisionsEnded) {
			const callback = triggerExitCbs.get(entity)
			if (callback)
				callback(collision)
		}
	}

	function system(dt: number) {
		updateCollisions()
		updateDebugDraw(debugDraw)
	}

	targetEngine.addSystem(system, priority.TriggerSystemPriority)

	function triggerAreasFromSpec(areas?: Array<TriggerAreaSpec>) {
		if (!areas)
			areas = [{ type: 'box' }]

		const triggerAreas: Array<TriggerArea> = []

		for (const area of areas) {
			if (area.type == 'box') {
				triggerAreas.push({
					$case: 'box',
					value: {
						position: area.position ? area.position : Vector3.Zero(),
						scale: area.scale ? area.scale : Vector3.One()
					}
				})
			} else {
				triggerAreas.push({
					$case: 'sphere',
					value: {
						position: area.position ? area.position : Vector3.Zero(),
						radius: area.radius ? area.radius : 1
					}
				})
			}
		}
		return triggerAreas
	}

	const triggersInterface = {
		addTrigger(
			entity: Entity,
			layerMask: number = NO_LAYERS,
			triggeredByMask: number = NO_LAYERS,
			areas?: Array<TriggerAreaSpec>,
			onEnterCallback?: OnTriggerEnterCallback,
			onExitCallback?: OnTriggerExitCallback,
			debugColor?: Color3
		) {
			if (layerMask < 0 || layerMask > ALL_LAYERS || !Number.isInteger(layerMask))
				throw new Error(`Bad layerMask: ${layerMask}. Expected a non-negative integer no greater than ${ALL_LAYERS}`)

			if (triggeredByMask < 0 || triggeredByMask > ALL_LAYERS || !Number.isInteger(triggeredByMask))
				throw new Error(`Bad triggeredByMask: ${triggeredByMask}. Expected a non-negative integer no greater than ${ALL_LAYERS}`)

			debugEntities.set(entity, [])
			activeCollisions.set(entity, new Set())
			triggerEnterCbs.set(entity, onEnterCallback)
			triggerExitCbs.set(entity, onExitCallback)

			Trigger.createOrReplace(entity, {
				active: true,
				layerMask: layerMask,
				triggeredByMask: triggeredByMask,
				areas: triggerAreasFromSpec(areas),
				debugColor: debugColor ? debugColor : Color3.Red()
			})
		},
		removeTrigger(entity: Entity) {
			const collisions = activeCollisions.get(entity)!
			const callback = triggerExitCbs.get(entity)

			for (const debugEntity of debugEntities.get(entity)!)
				targetEngine.removeEntity(debugEntity)

			debugEntities.delete(entity)
			activeCollisions.delete(entity)
			triggerEnterCbs.delete(entity)
			triggerExitCbs.delete(entity)
			Trigger.deleteFrom(entity)

			const collidingEntities = []
			for (const [otherEntity, otherEntityCollisions] of activeCollisions) {
				if (otherEntityCollisions.has(entity)) {
					otherEntityCollisions.delete(entity)
					collidingEntities.push(otherEntity)
				}
			}

			if (callback) {
				for (const collision of collisions)
					callback(collision)
			}

			for (const otherEntity of collidingEntities) {
				const callback = triggerExitCbs.get(otherEntity)
				if (callback)
					callback(entity)
			}
		},
		oneTimeTrigger(
			entity: Entity,
			layerMask: number = NO_LAYERS,
			triggeredByMask: number = NO_LAYERS,
			areas?: Array<TriggerAreaSpec>,
			onEnterCallback?: OnTriggerEnterCallback,
			debugColor?: Color3
		) {
			this.addTrigger(entity, layerMask, triggeredByMask, areas, function (e) {
				triggers.removeTrigger(entity)
				if (onEnterCallback)
					onEnterCallback(e)
			}, undefined, debugColor)
		},
		enableTrigger(entity: Entity, enabled: boolean) {
			Trigger.getMutable(entity).active = enabled
		},
		isTriggerEnabled(entity: Entity) {
			return Trigger.get(entity).active
		},
		getLayerMask(entity: Entity) {
			return Trigger.get(entity).layerMask
		},
		setLayerMask(entity: Entity, mask: number) {
			if (mask < 0 || mask > ALL_LAYERS || !Number.isInteger(mask))
				throw new Error(`Bad layerMask: ${mask}. Expected a non-negative integer no greater than ${ALL_LAYERS}`)
			Trigger.getMutable(entity).layerMask = mask
		},
		getTriggeredByMask(entity: Entity) {
			return Trigger.get(entity).triggeredByMask
		},
		setTriggeredByMask(entity: Entity, mask: number) {
			if (mask < 0 || mask > ALL_LAYERS || !Number.isInteger(mask))
				throw new Error(`Bad layerMask: ${mask}. Expected a non-negative integer no greater than ${ALL_LAYERS}`)
			Trigger.getMutable(entity).triggeredByMask = mask
		},
		getAreas(entity: Entity) {
			return Trigger.get(entity).areas
		},
		setAreas(entity: Entity, areas: Array<TriggerAreaSpec>) {
			Trigger.getMutable(entity).areas = triggerAreasFromSpec(areas)
		},
		setOnEnterCallback(entity: Entity, callback: OnTriggerEnterCallback) {
			triggerEnterCbs.set(entity, callback)
		},
		setOnExitCallback(entity: Entity, callback: OnTriggerExitCallback) {
			triggerExitCbs.set(entity, callback)
		},
		enableDebugDraw(enabled: boolean) {
			debugDraw = enabled
			if (!enabled) {
				for (const shapes of debugEntities.values()) {
					for (const shape of shapes)
						targetEngine.removeEntity(shape)
					shapes.length = 0
				}
			}
		},
		isDebugDrawEnabled() {
			return debugDraw
		}
	}

	triggersInterface.addTrigger(
		targetEngine.PlayerEntity, PLAYER_LAYER_ID, NO_LAYERS,
		[{
			type: 'box',
			scale: { x: 0.65, y: 1.92, z: 0.65 },
			position: { x: 0, y: 0.15, z: 0 }
		}],
		undefined, undefined, Color3.Green()
	)

	return triggersInterface
}

export const triggers = createTriggers(engine)


const EMPTY_IMMUTABLE_SET: Set<Entity> = new Set()

EMPTY_IMMUTABLE_SET.add = (entity: Entity) => { debugger; throw new Error("EMPTY_SET is read only") }
EMPTY_IMMUTABLE_SET.delete = (entity: Entity) => { throw new Error("EMPTY_SET is read only") }
EMPTY_IMMUTABLE_SET.has = (entity: Entity) => { return false }