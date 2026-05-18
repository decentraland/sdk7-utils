/// <reference types="jest" />

// Mock the DCL SDK modules before importing the functions under test
jest.mock('@dcl/sdk/ecs', () => {
  return {
    engine: {
      getEntitiesWith: jest.fn(() => []),
      addEntity: jest.fn(() => Math.floor(Math.random() * 1000) as any),
      RootEntity: 0 as any,
      PlayerEntity: 1 as any,
    },
    Transform: {
      getOrNull: jest.fn(),
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
    }
  }
})

jest.mock('@dcl/sdk/math', () => {
  return {
    Vector3: {
      create: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
    }
  }
})

import { getEntitiesWithParent, getEntityParent, getPlayerPosition, playSound, getEasingFunctionFromInterpolation } from './helpers'
import { InterpolationType } from './math'

// Import types only
import { Entity } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

describe('helpers.ts functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getEntitiesWithParent', () => {
    it('should return empty array when no entities have the given parent', () => {
      const mockedEcs = jest.requireMock('@dcl/sdk/ecs')
      
      // Mock to return no entities
      mockedEcs.engine.getEntitiesWith.mockReturnValue([])
      
      const mockParentEntity: Entity = 10 as any
      const result = getEntitiesWithParent(mockParentEntity)
      
      expect(result).toEqual([])
      expect(mockedEcs.engine.getEntitiesWith).toHaveBeenCalledWith(mockedEcs.Transform)
    })

    it('should return entities that have the given parent', () => {
      const mockedEcs = jest.requireMock('@dcl/sdk/ecs')
      
      const mockChildEntity1: Entity = 5 as any
      const mockChildEntity2: Entity = 6 as any
      const mockOtherEntity: Entity = 7 as any
      const mockParentEntity: Entity = 10 as any
      const mockOtherParent: Entity = 20 as any

      const mockTransforms: [Entity, { parent: Entity | null }][] = [
        [mockChildEntity1, { parent: mockParentEntity }], // Child of parent
        [mockChildEntity2, { parent: mockParentEntity }], // Child of parent
        [mockOtherEntity, { parent: mockOtherParent }],   // Child of different parent
      ] as [Entity, { parent: Entity | null }] []

      mockedEcs.engine.getEntitiesWith.mockReturnValue(mockTransforms)
      
      const mockParentEntity2: Entity = 10 as any
      const result = getEntitiesWithParent(mockParentEntity2)
      
      expect(result).toEqual([mockChildEntity1, mockChildEntity2])
    })

    it('should return empty array when entities have no parent', () => {
      const mockedEcs = jest.requireMock('@dcl/sdk/ecs')
      
      const mockEntityWithNoParent: Entity = 5 as any

      const mockTransforms: [Entity, { parent: Entity | null }][] = [
        [mockEntityWithNoParent, { parent: null }], // No parent
      ] as [Entity, { parent: Entity | null }] []

      mockedEcs.engine.getEntitiesWith.mockReturnValue(mockTransforms)
      
      const mockParentEntity: Entity = 10 as any
      const result = getEntitiesWithParent(mockParentEntity)
      
      expect(result).toEqual([])
    })
  })

  describe('getEntityParent', () => {
    it('should return parent when entity has a parent', () => {
      const mockedEcs = jest.requireMock('@dcl/sdk/ecs')
      
      const mockChildEntity: Entity = 5 as any
      const mockParentEntity: Entity = 10 as any
      const mockTransform = { parent: mockParentEntity }

      mockedEcs.Transform.getOrNull.mockReturnValue(mockTransform)
      
      const result = getEntityParent(mockChildEntity)
      
      expect(mockedEcs.Transform.getOrNull).toHaveBeenCalledWith(mockChildEntity)
      expect(result).toBe(mockParentEntity)
    })

    it('should return root entity when entity has no transform', () => {
      const mockedEcs = jest.requireMock('@dcl/sdk/ecs')
      
      const mockChildEntity: Entity = 5 as any

      mockedEcs.Transform.getOrNull.mockReturnValue(null)
      
      const result = getEntityParent(mockChildEntity)
      
      expect(mockedEcs.Transform.getOrNull).toHaveBeenCalledWith(mockChildEntity)
      expect(result).toBe(mockedEcs.engine.RootEntity)
    })

    it('should return undefined when entity transform has no parent property', () => {
      const mockedEcs = jest.requireMock('@dcl/sdk/ecs')
      
      const mockChildEntity: Entity = 5 as any
      const mockTransformWithoutParent = { parent: undefined } // No parent property

      mockedEcs.Transform.getOrNull.mockReturnValue(mockTransformWithoutParent)
      
      const result = getEntityParent(mockChildEntity)
      
      expect(mockedEcs.Transform.getOrNull).toHaveBeenCalledWith(mockChildEntity)
      expect(result).toBe(undefined)
    })
  })

  describe('getPlayerPosition', () => {
    it('should return player position when Transform exists', () => {
      const mockedEcs = jest.requireMock('@dcl/sdk/ecs')
      const mockedMath = jest.requireMock('@dcl/sdk/math')
      
      const mockPosition = { x: 1, y: 2, z: 3 }
      const mockTransform = { position: mockPosition }

      mockedEcs.Transform.getOrNull.mockReturnValue(mockTransform)
      
      const result = getPlayerPosition()
      
      expect(mockedEcs.Transform.getOrNull).toHaveBeenCalledWith(mockedEcs.engine.PlayerEntity)
      expect(result).toBe(mockPosition)
    })

    it('should return default position when Transform does not exist', () => {
      const mockedEcs = jest.requireMock('@dcl/sdk/ecs')
      const mockedMath = jest.requireMock('@dcl/sdk/math')
      
      mockedEcs.Transform.getOrNull.mockReturnValue(null)

      const mockZeroVector = { x: 0, y: 0, z: 0 }
      mockedMath.Vector3.create.mockReturnValue(mockZeroVector)
      
      const result = getPlayerPosition()
      
      expect(mockedEcs.Transform.getOrNull).toHaveBeenCalledWith(mockedEcs.engine.PlayerEntity)
      expect(result).toBe(mockZeroVector)
    })
  })

  describe('playSound', () => {
    it('should create audio source with correct parameters at player position when no position provided', () => {
      const mockedEcs = jest.requireMock('@dcl/sdk/ecs')
      
      const mockFile = 'audio.mp3'
      const mockLoop = true
      const mockPlayerPosition = { x: 1, y: 2, z: 3 }
      
      const mockEntity: Entity = 15 as any
      mockedEcs.engine.addEntity.mockReturnValue(mockEntity)

      // Mock getPlayerPosition to return mock position (mock Transform.getOrNull for player)
      mockedEcs.Transform.getOrNull.mockReturnValueOnce({ position: mockPlayerPosition }) // For getPlayerPosition

      const result = playSound(mockFile, mockLoop)
      
      expect(mockedEcs.engine.addEntity).toHaveBeenCalled()
      expect(mockedEcs.AudioSource.create).toHaveBeenCalledWith(mockEntity, {
        audioClipUrl: mockFile,
        loop: mockLoop,
        playing: true
      })
      expect(mockedEcs.Transform.create).toHaveBeenCalledWith(mockEntity, {
        position: mockPlayerPosition
      })
      expect(result).toBe(mockEntity)
    })

    it('should create audio source with correct parameters at specified position', () => {
      const mockedEcs = jest.requireMock('@dcl/sdk/ecs')
      
      const mockFile = 'audio.mp3'
      const mockLoop = false
      const mockPosition = { x: 5, y: 10, z: 15 }
      
      const mockEntity: Entity = 16 as any
      mockedEcs.engine.addEntity.mockReturnValue(mockEntity)

      const result = playSound(mockFile, mockLoop, mockPosition)
      
      expect(mockedEcs.engine.addEntity).toHaveBeenCalled()
      expect(mockedEcs.AudioSource.create).toHaveBeenCalledWith(mockEntity, {
        audioClipUrl: mockFile,
        loop: mockLoop,
        playing: true
      })
      expect(mockedEcs.Transform.create).toHaveBeenCalledWith(mockEntity, {
        position: mockPosition
      })
      expect(result).toBe(mockEntity)
    })
  })

  describe('getEasingFunctionFromInterpolation', () => {
    it('should map each InterpolationType to correct EasingFunction', () => {
      expect(getEasingFunctionFromInterpolation(InterpolationType.LINEAR)).toBe(0) // EF_LINEAR
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASEINQUAD)).toBe(1) // EF_EASEINQUAD
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASEOUTQUAD)).toBe(2) // EF_EASEOUTQUAD
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASEQUAD)).toBe(3) // EF_EASEQUAD
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASEINSINE)).toBe(4) // EF_EASEINSINE
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASEOUTSINE)).toBe(5) // EF_EASEOUTSINE
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASESINE)).toBe(6) // EF_EASESINE
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASEINEXPO)).toBe(7) // EF_EASEINEXPO
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASEOUTEXPO)).toBe(8) // EF_EASEOUTEXPO
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASEEXPO)).toBe(9) // EF_EASEEXPO
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASEINELASTIC)).toBe(10) // EF_EASEINELASTIC
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASEOUTELASTIC)).toBe(11) // EF_EASEOUTELASTIC
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASEELASTIC)).toBe(12) // EF_EASEELASTIC
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASEINBOUNCE)).toBe(13) // EF_EASEINBOUNCE
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASEOUTEBOUNCE)).toBe(14) // EF_EASEOUTBOUNCE
      expect(getEasingFunctionFromInterpolation(InterpolationType.EASEBOUNCE)).toBe(15) // EF_EASEBOUNCE
    })

    it('should return default EasingFunction for unknown InterpolationType', () => {
      // Test with a value that doesn't match any InterpolationType
      const unknownType = 'unknown-type' as InterpolationType
      expect(getEasingFunctionFromInterpolation(unknownType)).toBe(0) // EF_LINEAR (default)
    })
  })
})