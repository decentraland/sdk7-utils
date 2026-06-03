/// <reference types="jest" />

// Mock the DCL SDK modules before importing anything from our modules
jest.mock('@dcl/sdk/ecs', () => {
  const mockAddSystem = jest.fn()

  return {
    engine: {
      addSystem: mockAddSystem,
      removeSystem: jest.fn(),
      getEntitiesWith: jest.fn(() => []),
      addEntity: jest.fn(() => Math.floor(Math.random() * 1000) as any),
      RootEntity: 0 as any,
      PlayerEntity: 1 as any,
      defineComponent: jest.fn((name, schema) => ({
        _id: Math.floor(Math.random() * 1000),
        schema
      })),
    },
    Transform: {
      getOrNull: jest.fn(),
      get: jest.fn(() => ({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } })),
      create: jest.fn(),
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

// Mock the priority module to avoid dependency issues
jest.mock('./priority', () => {
  return {
    priority: {
      TimerSystemPriority: 100
    }
  }
})

import { timers } from './timer'

describe('Timer', () => {
  let callbackSpy: jest.Mock

  beforeEach(() => {
    callbackSpy = jest.fn()
    // Reset mocks between tests
    jest.clearAllMocks()
  })

  describe('setTimeout', () => {
    it('should return a timer ID when scheduling a timeout', () => {
      const timerId = timers.setTimeout(callbackSpy, 1000) // 1 second

      expect(typeof timerId).toBe('number')
      expect(timerId).toBeGreaterThanOrEqual(0)
    })

    it('should allow clearing the timeout', () => {
      const timerId = timers.setTimeout(callbackSpy, 1000)

      expect(() => timers.clearTimeout(timerId)).not.toThrow()
    })
  })

  describe('setInterval', () => {
    it('should return a timer ID when scheduling an interval', () => {
      const timerId = timers.setInterval(callbackSpy, 500) // every 500ms

      expect(typeof timerId).toBe('number')
      expect(timerId).toBeGreaterThanOrEqual(0)
    })

    it('should allow clearing the interval', () => {
      const timerId = timers.setInterval(callbackSpy, 500)

      expect(() => timers.clearInterval(timerId)).not.toThrow()
    })
  })

  describe('clearTimeout and clearInterval', () => {
    it('should accept any timer ID and attempt to clear it without throwing', () => {
      const invalidTimerId = 999 // This timer doesn't exist

      // These should not throw errors even with invalid IDs
      expect(() => timers.clearTimeout(invalidTimerId)).not.toThrow()
      expect(() => timers.clearInterval(invalidTimerId)).not.toThrow()
    })

    it('should not call the callback if cleared before execution', () => {
      const timerId = timers.setTimeout(callbackSpy, 1000)
      timers.clearTimeout(timerId)

      // The callback should not be called since the timer was cleared
      expect(callbackSpy).not.toHaveBeenCalled()
    })
  })

  describe('timer ID generation', () => {
    it('should return unique timer IDs for setTimeout', () => {
      const id1 = timers.setTimeout(callbackSpy, 1000)
      const id2 = timers.setTimeout(callbackSpy, 1000)

      expect(id1).not.toBe(id2)
      expect(id1).toBeGreaterThanOrEqual(0)
      expect(id2).toBeGreaterThanOrEqual(0)
    })

    it('should return unique timer IDs for setInterval', () => {
      const id1 = timers.setInterval(callbackSpy, 500)
      const id2 = timers.setInterval(callbackSpy, 500)

      expect(id1).not.toBe(id2)
      expect(id1).toBeGreaterThanOrEqual(0)
      expect(id2).toBeGreaterThanOrEqual(0)
    })

    it('should return unique IDs across setTimeout and setInterval', () => {
      const id1 = timers.setTimeout(callbackSpy, 1000)
      const id2 = timers.setInterval(callbackSpy, 500)

      expect(id1).not.toBe(id2)
      expect(id1).toBeGreaterThanOrEqual(0)
      expect(id2).toBeGreaterThanOrEqual(0)
    })
  })

  describe('functionality verification', () => {
    it('should have all required timer methods', () => {
      expect(timers).toHaveProperty('setTimeout')
      expect(timers).toHaveProperty('clearTimeout')
      expect(timers).toHaveProperty('setInterval')
      expect(timers).toHaveProperty('clearInterval')

      // Verify they are functions
      expect(typeof timers.setTimeout).toBe('function')
      expect(typeof timers.clearTimeout).toBe('function')
      expect(typeof timers.setInterval).toBe('function')
      expect(typeof timers.clearInterval).toBe('function')
    })

    it('should handle zero millisecond timeouts', () => {
      expect(() => timers.setTimeout(callbackSpy, 0)).not.toThrow()
    })

    it('should handle zero millisecond intervals', () => {
      expect(() => timers.setInterval(callbackSpy, 0)).not.toThrow()
    })

    it('should handle large millisecond values', () => {
      expect(() => timers.setTimeout(callbackSpy, 999999)).not.toThrow()
      expect(() => timers.setInterval(callbackSpy, 999999)).not.toThrow()
    })
  })
})