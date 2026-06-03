/// <reference types="jest" />

// Mock the DCL SDK modules before importing anything from our modules
jest.mock('@dcl/sdk/ecs', () => {
  const mockDefineComponent = jest.fn((name, schema) => ({
    _id: Math.floor(Math.random() * 1000),
    schema
  }))

  return {
    engine: {
      addSystem: jest.fn(),
      removeSystem: jest.fn(),
      getEntitiesWith: jest.fn(() => []),
      addEntity: jest.fn(() => Math.floor(Math.random() * 1000) as any),
      RootEntity: 0 as any,
      PlayerEntity: 1 as any,
      defineComponent: mockDefineComponent,
    },
    Transform: {
      getOrNull: jest.fn(),
      get: jest.fn(() => ({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } })),
      create: jest.fn(),
    },
    AudioSource: {
      create: jest.fn(),
    },
    EasingFunction: {
      EF_LINEAR: 0,
      EF_EASEINQUAD: 1,
      EF_EASEOUTQUAD: 2,
      EF_EASEQUAD: 3,
      EF_EASEINSINE: 4,
      EF_EASEOUTSINE: 5,
      EF_EASESINE: 6,
      EF_EASEINEXPO: 7,
      EF_EASEOUTEXPO: 8,
      EF_EASEEXPO: 9,
      EF_EASEINELASTIC: 10,
      EF_EASEOUTELASTIC: 11,
      EF_EASEELASTIC: 12,
      EF_EASEINBOUNCE: 13,
      EF_EASEOUTBOUNCE: 14,
      EF_EASEBOUNCE: 15,
    },
    InputAction: {
      IA_POINTER: 0,
      IA_KEYBOARD: 1,
    },
    OnPointerDown: {
      ACTION_ID: 'onPointerDown'
    },
    ColliderLayer: {
      CL_DEFAULT: 1,
      CL_POINTER: 2,
      CL_PHYSICS: 4
    },
    UuidShape: {
      create: jest.fn()
    },
    GltfContainer: {
      create: jest.fn()
    },
    AudioSourceState: {
      create: jest.fn()
    },
    VisibilityComponent: {
      create: jest.fn()
    },
    Schemas: {
      Array: jest.fn((schema) => ({ type: 'array', elementSchema: schema })),
      EnumNumber: jest.fn((enumType, defaultValue) => ({
        type: 'enum',
        enumType: enumType,
        defaultValue: defaultValue
      })),
      Optional: jest.fn((schema) => schema),
      String: jest.fn(() => ({ type: 'string' })),
      Boolean: jest.fn(() => ({ type: 'boolean' })),
      Number: jest.fn(() => ({ type: 'number' })),
      Vector3: jest.fn(() => ({ type: 'vector3' })),
      Quaternion: jest.fn(() => ({ type: 'quaternion' })),
    }
  }
})

jest.mock('@dcl/sdk/math', () => {
  return {
    Vector3: {
      create: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
      clone: jest.fn(obj => ({ ...obj })),
      add: jest.fn((a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z })),
      rotate: jest.fn((v, q) => v),
      distanceSquared: jest.fn((a, b) => (a.x - b.x)**2 + (a.y - b.y)**2 + (a.z - b.z)**2),
      Zero: jest.fn(() => ({ x: 0, y: 0, z: 0 }))
    },
    Quaternion: {
      Identity: jest.fn(() => ({ x: 0, y: 0, z: 0, w: 1 })),
      multiply: jest.fn((a, b) => a),
      rotate: jest.fn((v, q) => v),
      catmullRom: jest.fn((p0, p1, p2, p3, t) => p1)
    }
  }
})

import * as index from './index'

describe('index.ts exports', () => {
  test('should export all required functionality', () => {
    // Math exports
    expect(index.InterpolationType).toBeDefined()
    expect(index.remap).toBeDefined()
    expect(index.interpolate).toBeDefined()
    expect(index.getWorldPosition).toBeDefined()
    expect(index.getWorldRotation).toBeDefined()

    // Debug exports
    expect(index.addLabel).toBeDefined()
    expect(index.addTestCube).toBeDefined()

    // Toggle exports
    expect(index.ToggleState).toBeDefined()
    expect(index.toggles).toBeDefined()

    // Tween exports
    expect(index.tweens).toBeDefined()

    // Audio exports
    expect(index.sounds).toBeDefined()

    // Perpetual Motion exports
    expect(index.perpetualMotions).toBeDefined()

    // Path exports
    expect(index.paths).toBeDefined()

    // Trigger exports
    expect(index.triggers).toBeDefined()
    expect(index.LAYER_1).toBeDefined()
    expect(index.LAYER_2).toBeDefined()
    expect(index.LAYER_3).toBeDefined()
    expect(index.LAYER_4).toBeDefined()
    expect(index.LAYER_5).toBeDefined()
    expect(index.LAYER_6).toBeDefined()
    expect(index.LAYER_7).toBeDefined()
    expect(index.LAYER_8).toBeDefined()
    expect(index.ALL_LAYERS).toBeDefined()
    expect(index.NO_LAYERS).toBeDefined()
    expect(index.PLAYER_LAYER_ID).toBeDefined()

    // Timer exports
    expect(index.timers).toBeDefined()

    // Action exports
    expect(index.actions).toBeDefined()

    // Priority exports
    expect(index.priority).toBeDefined()

    // Helper exports
    expect(index.getEntitiesWithParent).toBeDefined()
    expect(index.getEntityParent).toBeDefined()
    expect(index.getPlayerPosition).toBeDefined()
    expect(index.playSound).toBeDefined()
    expect(index.getEasingFunctionFromInterpolation).toBeDefined()
  })

  test('should have correct InterpolationType values', () => {
    expect(index.InterpolationType).toHaveProperty('LINEAR')
    expect(index.InterpolationType).toHaveProperty('EASEINQUAD')
    expect(index.InterpolationType).toHaveProperty('EASEOUTQUAD')
    expect(index.InterpolationType).toHaveProperty('EASEQUAD')
  })

  test('should have correct layer constants', () => {
    expect(typeof index.LAYER_1).toBe('number')
    expect(typeof index.LAYER_2).toBe('number')
    expect(typeof index.LAYER_3).toBe('number')
    expect(typeof index.LAYER_4).toBe('number')
    expect(typeof index.LAYER_5).toBe('number')
    expect(typeof index.LAYER_6).toBe('number')
    expect(typeof index.LAYER_7).toBe('number')
    expect(typeof index.LAYER_8).toBe('number')
    expect(typeof index.ALL_LAYERS).toBe('number')
    expect(typeof index.NO_LAYERS).toBe('number')
    expect(typeof index.PLAYER_LAYER_ID).toBe('number')
  })

  test('should have working remap function', () => {
    // If remap function exists, test it with basic inputs
    if (typeof index.remap === 'function') {
      expect(() => index.remap(0, 0, 10, 0, 100)).not.toThrow()
    }
  })

  test('should have working interpolate function', () => {
    // If interpolate function exists, test it with basic inputs
    if (typeof index.interpolate === 'function') {
      expect(() => {
        // The interpolate function takes an InterpolationType and a value t
        index.interpolate(index.InterpolationType.LINEAR, 0.5)
      }).not.toThrow()

      // Test with different interpolation types
      expect(() => {
        index.interpolate(index.InterpolationType.EASEINQUAD, 0.3)
      }).not.toThrow()

      expect(() => {
        index.interpolate(index.InterpolationType.EASEOUTQUAD, 0.7)
      }).not.toThrow()
    }
  })

  test('should have singleton instances for state management', () => {
    // Check that singleton instances are properly initialized
    expect(index.toggles).toBeDefined()
    expect(index.tweens).toBeDefined()
    expect(index.sounds).toBeDefined()
    expect(index.perpetualMotions).toBeDefined()
    expect(index.paths).toBeDefined()
    expect(index.triggers).toBeDefined()
    expect(index.timers).toBeDefined()
  })

  test('should have priority system available', () => {
    expect(index.priority).toBeDefined()
  })

  test('should have actions system available', () => {
    expect(index.actions).toBeDefined()
  })
})