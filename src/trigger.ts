// @ts-ignore - newer SDK exposes these
import { engine, Entity, IEngine, MeshRenderer, Transform, Material, EntityState, TriggerArea, triggerAreaEventsSystem, ColliderLayer } from '@dcl/sdk/ecs'
import { Vector3, Color4, Color3, Quaternion } from '@dcl/sdk/math'
import { getWorldPosition, getWorldRotation } from './math'
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
// Keep legacy internal union type name distinct from SDK's TriggerArea
type InternalTriggerArea = { $case: 'box', value: TriggerBoxArea } | { $case: 'sphere', value: TriggerSphereArea }

type OnTriggerEnterCallback = (entity: Entity) => void
type OnTriggerExitCallback = (entity: Entity) => void

export type Triggers = ReturnType<typeof createTriggers>

function createTriggers(targetEngine: IEngine) {
	// State per root trigger owner
	const stateByRoot: Map<Entity, {
		active: boolean,
		layerMask: number,
		triggeredByMask: number,
		areas: Array<TriggerAreaSpec>,
		onEnter?: OnTriggerEnterCallback,
		onExit?: OnTriggerExitCallback,
		debugColor: Color3
	}> = new Map()

	// Child area entities per root
	const areaChildrenByRoot: Map<Entity, Array<Entity>> = new Map()
	// Reverse lookup from area child to root
	const childToRoot: Map<Entity, Entity> = new Map()
	// Active overlap counts per root-other pair (to de-dupe across multiple areas)
	const overlapCountByPair: Map<Entity, Map<Entity, number>> = new Map()
	// Debug flag
	let debugDraw = false

    function utilsMaskToColliderCustom(mask: number): number {
		let res = 0
        if (mask & LAYER_1) res |= ColliderLayer.CL_CUSTOM1
        if (mask & LAYER_2) res |= ColliderLayer.CL_CUSTOM2
        if (mask & LAYER_3) res |= ColliderLayer.CL_CUSTOM3
        if (mask & LAYER_4) res |= ColliderLayer.CL_CUSTOM4
        if (mask & LAYER_5) res |= ColliderLayer.CL_CUSTOM5
        if (mask & LAYER_6) res |= ColliderLayer.CL_CUSTOM6
        if (mask & LAYER_7) res |= ColliderLayer.CL_CUSTOM7
        if (mask & LAYER_8) res |= ColliderLayer.CL_CUSTOM8
		return res
	}

	function utilsTriggeredByToTriggerAreaMask(triggeredByMask: number): number {
		let res = utilsMaskToColliderCustom(triggeredByMask)
        // Include player layer if requested via PLAYER_LAYER_ID bit
		if (triggeredByMask & PLAYER_LAYER_ID) {
			// @ts-ignore newer SDKs expose CL_PLAYER in ColliderLayer
			res |= (ColliderLayer.CL_PLAYER as unknown as number)
		}
		return res
	}

	function buildInternalAreasFromSpec(areas?: Array<TriggerAreaSpec>): Array<InternalTriggerArea> {
		if (!areas)
			areas = [{ type: 'box' }]
		const result: Array<InternalTriggerArea> = []
		for (const area of areas) {
			if (area.type == 'box') {
				result.push({
					$case: 'box',
					value: {
						position: area.position ? area.position : Vector3.Zero(),
						scale: area.scale ? area.scale : Vector3.One()
					}
				})
			} else {
				result.push({
					$case: 'sphere',
					value: {
						position: area.position ? area.position : Vector3.Zero(),
						radius: area.radius ? area.radius : 1
					}
				})
			}
		}
		return result
	}

	function setChildTransformFromRoot(child: Entity, root: Entity, area: InternalTriggerArea) {
		const rootWorldPos = getWorldPosition(root)
		const rootWorldRot = getWorldRotation(root)
		const offset = Vector3.rotate(area.value.position, rootWorldRot)
		const position = Vector3.add(rootWorldPos, offset)
		let scale: Vector3
		let rotation: Quaternion
		if (area.$case == 'box') {
			scale = area.value.scale
			rotation = rootWorldRot
		} else {
			scale = { x: area.value.radius, y: area.value.radius, z: area.value.radius }
			rotation = Quaternion.Identity()
		}
		Transform.createOrReplace(child, {
			position: position,
			scale: scale,
			rotation: rotation
		})
	}

    function attachComponentsToAreaChild(child: Entity, area: InternalTriggerArea, triggeredByMask: number, layerMask: number) {
		const triggerMask = utilsTriggeredByToTriggerAreaMask(triggeredByMask)
		if (area.$case == 'box') {
            TriggerArea.setBox(child, triggerMask)
		} else {
            TriggerArea.setSphere(child, triggerMask)
		}
	}

    function subscribeAreaEvents(child: Entity, root: Entity) {
        triggerAreaEventsSystem.onTriggerEnter(child, (result: any) => {
			const rootState = stateByRoot.get(root)
			if (!rootState || !rootState.active) return
			let other = result.trigger.entity
			if (childToRoot.has(other)) other = childToRoot.get(other)!
			if (other == root) return
			let map = overlapCountByPair.get(root)
			if (!map) {
				map = new Map()
				overlapCountByPair.set(root, map)
			}
			const prev = map.get(other) || 0
			const next = prev + 1
			map.set(other, next)
			if (prev == 0 && rootState.onEnter) rootState.onEnter(other)
		})

        triggerAreaEventsSystem.onTriggerExit(child, (result: any) => {
			const rootState = stateByRoot.get(root)
			if (!rootState) return
			let other = result.trigger.entity
			if (childToRoot.has(other)) other = childToRoot.get(other)!
			if (other == root) return
			const map = overlapCountByPair.get(root)
			if (!map) return
			const prev = map.get(other) || 0
			if (prev <= 0) return
			const next = prev - 1
			if (next == 0) {
				map.delete(other)
				if (rootState.onExit) rootState.onExit(other)
			} else {
				map.set(other, next)
			}
		})
	}

	function createAreaChildren(root: Entity) {
		const s = stateByRoot.get(root)!
		const areas = buildInternalAreasFromSpec(s.areas)
		const children: Array<Entity> = []
		for (const area of areas) {
			const child = targetEngine.addEntity()
			childToRoot.set(child, root)
			setChildTransformFromRoot(child, root, area)
			attachComponentsToAreaChild(child, area, s.triggeredByMask, s.layerMask)
			subscribeAreaEvents(child, root)
			children.push(child)
		}
		areaChildrenByRoot.set(root, children)
	}

	function destroyAreaChildren(root: Entity) {
		const children = areaChildrenByRoot.get(root)
		if (!children) return
		for (const child of children) {
			if (debugDraw) {
				// remove debug visuals (component removal not needed explicitly; entity removal suffices)
			}
			childToRoot.delete(child)
			targetEngine.removeEntity(child)
		}
		areaChildrenByRoot.delete(root)
	}

	function updateDebugForRoot(root: Entity) {
		const s = stateByRoot.get(root)
		if (!s) return
		const children = areaChildrenByRoot.get(root) || []
		for (const child of children) {
			if (debugDraw) {
				// Draw shape on the same entity as the trigger area
				// We don't know shape here; infer from presence of MeshCollider (box vs sphere) via s.areas order
				// Simpler: set both, engine will keep last; but we know spec order
			}
		}
	}

	function setDebugMeshForArea(child: Entity, area: InternalTriggerArea, color: Color3, active: boolean) {
		if (area.$case == 'box') MeshRenderer.setBox(child)
		else MeshRenderer.setSphere(child)
		const c = active ? color : Color3.Black()
		Material.setPbrMaterial(child, { albedoColor: Color4.fromInts(255 * c.r, 255 * c.g, 255 * c.b, 75) })
	}

	function refreshDebugMeshes(root: Entity) {
		if (!debugDraw) return
		const s = stateByRoot.get(root)!
		const areas = buildInternalAreasFromSpec(s.areas)
		const children = areaChildrenByRoot.get(root) || []
		for (let i = 0; i < children.length; i++) setDebugMeshForArea(children[i], areas[i], s.debugColor, s.active)
	}

	function enableDisableRoot(root: Entity, enabled: boolean) {
		const s = stateByRoot.get(root)!
		s.active = enabled
		const children = areaChildrenByRoot.get(root) || []
		for (const child of children) {
			if (enabled) {
				// Re-attach components per current config
				// Determine area by index
			}
		}
		// On disable, clear overlaps and fire exits
		if (!enabled) {
			const map = overlapCountByPair.get(root)
			if (map) {
				const onExit = s.onExit
				for (const other of map.keys()) if (onExit) onExit(other)
				map.clear()
			}
		}
		refreshDebugMeshes(root)
	}

	function system(dt: number) {
		// Cleanup removed roots
		for (const [root] of stateByRoot) {
			if (targetEngine.getEntityState(root) == EntityState.Removed) {
				destroyAreaChildren(root)
				stateByRoot.delete(root)
				overlapCountByPair.delete(root)
			}
		}
		// Update transforms of area children to keep axis-aligned boxes and correct offsets
		for (const [root, s] of stateByRoot) {
			const areas = buildInternalAreasFromSpec(s.areas)
			const children = areaChildrenByRoot.get(root) || []
			for (let i = 0; i < children.length; i++) setChildTransformFromRoot(children[i], root, areas[i])
		}
	}

	targetEngine.addSystem(system, priority.TriggerSystemPriority)

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

			stateByRoot.set(entity, {
				active: true,
				layerMask: layerMask,
				triggeredByMask: triggeredByMask,
				areas: areas ? areas : [{ type: 'box' }],
				onEnter: onEnterCallback,
				onExit: onExitCallback,
				debugColor: debugColor ? debugColor : Color3.Red()
			})
			createAreaChildren(entity)
			refreshDebugMeshes(entity)
		},
		removeTrigger(entity: Entity) {
			// Fire exit for any active overlaps
			const map = overlapCountByPair.get(entity)
			const s = stateByRoot.get(entity)
			if (map && s && s.onExit) {
				for (const other of map.keys()) s.onExit(other)
			}
			overlapCountByPair.delete(entity)
			destroyAreaChildren(entity)
			stateByRoot.delete(entity)
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
			if (!stateByRoot.has(entity)) return
			enableDisableRoot(entity, enabled)
			// Also toggle components to avoid activating others
			const s = stateByRoot.get(entity)!
			const areas = buildInternalAreasFromSpec(s.areas)
			const children = areaChildrenByRoot.get(entity) || []
            for (let i = 0; i < children.length; i++) {
                const child = children[i]
                // Re-attach or remove components
                if (enabled) {
                    attachComponentsToAreaChild(child, areas[i], s.triggeredByMask, s.layerMask)
                } else {
                    // Remove components by resetting to neutral layer
                    if (areas[i].$case == 'box') {
                        TriggerArea.setBox(child, ColliderLayer.CL_NONE)
                    } else {
                        TriggerArea.setSphere(child, ColliderLayer.CL_NONE)
                    }
                }
            }
		},
		isTriggerEnabled(entity: Entity) {
			const s = stateByRoot.get(entity)
			return !!(s && s.active)
		},
		getLayerMask(entity: Entity) {
			return stateByRoot.get(entity)?.layerMask ?? NO_LAYERS
		},
		setLayerMask(entity: Entity, mask: number) {
			if (mask < 0 || mask > ALL_LAYERS || !Number.isInteger(mask))
				throw new Error(`Bad layerMask: ${mask}. Expected a non-negative integer no greater than ${ALL_LAYERS}`)
			const s = stateByRoot.get(entity)
			if (!s) return
			s.layerMask = mask
            // No colliders created/managed
			refreshDebugMeshes(entity)
		},
		getTriggeredByMask(entity: Entity) {
			return stateByRoot.get(entity)?.triggeredByMask ?? NO_LAYERS
		},
		setTriggeredByMask(entity: Entity, mask: number) {
			if (mask < 0 || mask > ALL_LAYERS || !Number.isInteger(mask))
				throw new Error(`Bad layerMask: ${mask}. Expected a non-negative integer no greater than ${ALL_LAYERS}`)
			const s = stateByRoot.get(entity)
			if (!s) return
			s.triggeredByMask = mask
			const areas = buildInternalAreasFromSpec(s.areas)
			const children = areaChildrenByRoot.get(entity) || []
            const la = utilsTriggeredByToTriggerAreaMask(mask)
            for (let i = 0; i < children.length; i++) {
                if (areas[i].$case == 'box') TriggerArea.setBox(children[i], la)
                else TriggerArea.setSphere(children[i], la)
            }
		},
		getAreas(entity: Entity) {
			return stateByRoot.get(entity)?.areas ?? []
		},
		setAreas(entity: Entity, areas: Array<TriggerAreaSpec>) {
			const s = stateByRoot.get(entity)
			if (!s) return
			s.areas = areas
			// rebuild children to match new shapes
			destroyAreaChildren(entity)
			createAreaChildren(entity)
			refreshDebugMeshes(entity)
		},
		setOnEnterCallback(entity: Entity, callback: OnTriggerEnterCallback) {
			const s = stateByRoot.get(entity)
			if (!s) return
			s.onEnter = callback
		},
		setOnExitCallback(entity: Entity, callback: OnTriggerExitCallback) {
			const s = stateByRoot.get(entity)
			if (!s) return
			s.onExit = callback
		},
		enableDebugDraw(enabled: boolean) {
			debugDraw = enabled
			// Re-apply meshes for all roots
			for (const root of stateByRoot.keys()) refreshDebugMeshes(root)
		},
		isDebugDrawEnabled() {
			return debugDraw
		}
	}

	return triggersInterface
}

export const triggers = createTriggers(engine)
