import { Entity, engine, Transform, AudioSource, EasingFunction } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { InterpolationType } from './math';

/**
 * Returns an array of entities that all share the provided entity as parent.
 *
 * @param parent - Parent of the entities you want to fetch.
 * @returns An array of entities that are children of the provided entity. If the entity has no children, it returns an empty array.
 * @public
 */
export function getEntitiesWithParent(
	parent: Entity
): Entity[] {
	const entitiesWithParent: Entity[] = [];

	for (const [entity, transform] of engine.getEntitiesWith(Transform)) {
		if (transform.parent === parent) {
			entitiesWithParent.push(entity);
		}
	}

	return entitiesWithParent;
}


/**
 * Returns an entity that is the parent of the provided entity.
 *
 * @param child - Child of the entity you want to fetch.
 * @returns The parent entity. If no parent is found it defaults to the root entity of the scene.
 * @public
 */

export function getEntityParent(
	child: Entity
): Entity {
	const transform = Transform.getOrNull(child);
	if (transform) {
		return transform.parent as Entity;
	} else {
		return engine.RootEntity as Entity;
	}
}


/**
 * Returns the position of the player's avatar.
 *
 * @returns A Vector3 with the current position of the player's avatar, relative to the scene's origin. If no data can be retrieved, it returns (0,0,0).
 * @public
 */
export function getPlayerPosition(): Vector3 {
	return Transform.getOrNull(engine.PlayerEntity)?.position || Vector3.create()
}



/**
 * Plays a sound from an audio file, at a given location in the scene.
 *
 * @param file - Path to an audio file stored in the scene's folder, as a string.
 * @param loop - Boolean to specify if the sound should be played once or looped. False by default.
 * @param position - Vector3 with the position relative to the scene's origin. If not provided, the sound plays at the camera's location.
 * @returns An array of [entity, transform] for each entity that is a child of the provided entity. If the entity has no children, it returns null.
 * @public
 */
export function playSound(
	file: string,
	loop: boolean = false,
	position?: Vector3
) {
	const entity = engine.addEntity()
	AudioSource.create(entity, {
		audioClipUrl: file,
		loop,
		playing: true
	})

	Transform.create(entity, {
		position: position ? position : getPlayerPosition()
	})

	return entity
}

/**
 * Maps an EasingFunction to the provided InterpolationType
 *
 * @param type - an InterpolationType enum type
 * @returns An EasingFunction enum type
 * @public
 */
export function getEasingFunctionFromInterpolation(type: InterpolationType): EasingFunction {
	switch (type) {
		case InterpolationType.LINEAR:
			return EasingFunction.EF_LINEAR
		case InterpolationType.EASEINQUAD:
			return EasingFunction.EF_EASEINQUAD
		case InterpolationType.EASEOUTQUAD:
			return EasingFunction.EF_EASEOUTQUAD
		case InterpolationType.EASEQUAD:
			return EasingFunction.EF_EASEQUAD
		case InterpolationType.EASEINSINE:
			return EasingFunction.EF_EASEINSINE
		case InterpolationType.EASEOUTSINE:
			return EasingFunction.EF_EASEOUTSINE
		case InterpolationType.EASESINE:
			return EasingFunction.EF_EASESINE
		case InterpolationType.EASEINEXPO:
			return EasingFunction.EF_EASEINEXPO
		case InterpolationType.EASEOUTEXPO:
			return EasingFunction.EF_EASEOUTEXPO
		case InterpolationType.EASEEXPO:
			return EasingFunction.EF_EASEEXPO
		case InterpolationType.EASEINELASTIC:
			return EasingFunction.EF_EASEINELASTIC
		case InterpolationType.EASEOUTELASTIC:
			return EasingFunction.EF_EASEOUTELASTIC
		case InterpolationType.EASEELASTIC:
			return EasingFunction.EF_EASEELASTIC
		case InterpolationType.EASEINBOUNCE:
			return EasingFunction.EF_EASEINBOUNCE
		case InterpolationType.EASEOUTEBOUNCE:
			return EasingFunction.EF_EASEOUTBOUNCE
		case InterpolationType.EASEBOUNCE:
			return EasingFunction.EF_EASEBOUNCE
		default:
			return EasingFunction.EF_LINEAR
	}
}
