import {
  Entity, Transform, TextShape, Billboard, TransformType, MeshRenderer,
  MeshCollider, Material, pointerEventsSystem, engine, EventSystemCallback, InputAction
} from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'

/**
 * Creates a text label spatially linked to an entity
 *
 * @param text - Text to use on label
 * @param parent - Entity to place label on.
 * @param billboard - If true, label turns to always face player.
 * @param color - Text color. Black by default.
 * @param size - Text font size, 3 by default.
 * @param textOffset - Offset from parent entity's position. By default 1.5 meters above the parent.
 * @returns A new entity with the configured settings that is a child of the provided parent
 * @public
 */
export function addLabel(
  text: string,
  parent: Entity,
  billboard?: boolean,
  color?: Color4,
  size?: number,
  textOffset?: Vector3
): Entity {
  let label = engine.addEntity()

  Transform.create(label, {
    position: textOffset ? textOffset : Vector3.create(0, 1.5, 0),
    parent: parent
  })

  let textShape = TextShape.create(label)
  textShape.text = text
  textShape.fontSize = size ? size : 3
  textShape.textColor = color ? color : Color4.Black()

  if (billboard) {
    Billboard.create(label)
  }

  return label
}

/**
 * Creates a cube that can run functions when clicked.
 *
 * @param transform - Transform arguments for the cube, including position, scale and rotation
 * @param triggeredFunction - Function to execute every time the cube is clicked.
 * @param label - Text to display over cube and on hover.
 * @param color - Cube color.
 * @param sphere - If true, use a sphere shape instead of cube.
 * @param noCollider - If true, cube has no collider.
 * @returns A new entity with the configured settings and a label as a child
 * @public
 */
export function addTestCube(
  transform?: Partial<TransformType>,
  triggeredFunction?: EventSystemCallback,
  label?: string,
  color?: Color4,
  sphere?: boolean,
  noCollider?: boolean
): Entity {
  let cube = engine.addEntity()

  Transform.create(cube, transform)

  if (sphere) {
    let sphereTransform = Transform.getMutable(cube)
    sphereTransform.scale = Vector3.multiplyByFloats(sphereTransform.scale, 0.5, 0.5, 0.5)
    MeshRenderer.setSphere(cube)
    if (!noCollider)
      MeshCollider.setSphere(cube);
  } else {
    MeshRenderer.setBox(cube)
    if (!noCollider)
      MeshCollider.setBox(cube)
  }

  if (color) {
    Material.setPbrMaterial(cube, { albedoColor: color })
  }

  if (label) {
    addLabel(label, cube, true)
  }
  
  if (triggeredFunction) {
    pointerEventsSystem.onPointerDown(cube, triggeredFunction, {
      button: InputAction.IA_POINTER,
      hoverText: label ? label : 'click'
    })
  }

  return cube
}
