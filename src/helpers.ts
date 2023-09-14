import { Entity, engine, Transform, AudioSource } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

/**
 * Returns an array of entities that all share the provided entity as parent.
 *
 * @param parent - Parent of the entities you want to fetch. 
 * @returns An array of [entity, transform] for each entity that is a child of the provided entity. If the entity has no children, it returns null.
 * @public
 */
export function* getEntitiesWithParent(
	parent: Entity
) {
	for (const [entity, transform] of engine.getEntitiesWith(Transform)) {
		if (transform.parent === parent) {
			yield [entity, transform]
		}
	}
}


/**
 * Returns an entity that is the parent of the provided entity.
 *
 * @param child - Child of the entity you want to fetch. 
 * @returns The parent entity. If no parent is found it defaults to the root entity of the scene.
 * @public
 */
export function* getEntityParent(
	child: Entity
) {
	return Transform.getOrNull(entity)?.parent || engine.RootEntity
}


/**
 * Returns the position of the player's avatar.
 *
 * @returns A Vector3 with the current position of the player's avatar, relative to the scene's origin. If no data can be retrieved, it returns (0,0,0).
 * @public
 */
export function getPlayerPosition() {
	return Transform.getOrNull(engine.PlayerEntity)?.position || Vector3.create()
}



/**
 * Plays a sound from an audio file, at a given location in the scene.
 *
 * @param file - Path to an audio file stored in the scene's folder, as a string.
 * @param loop - Boolean to specify if the sound should be played once or looped. False by default.
 * @param position - Vector3 with the position relative to the scene's origin. If not provided, the sound plays at the camera's location.
 * 
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
		parent: position ? engine.RootEntity : engine.CameraEntity,
		position
	})

	return entity
}
