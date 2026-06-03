/// <reference types="jest" />

import { perpetualMotions, AXIS } from './perpetualMotion'

// Mock the priority module
jest.mock('./priority', () => ({
  priority: {
    PerpetualMotionSystemPriority: 10
  }
}))

// Create a mock entity for testing
const mockEntity = 'test-entity' as any;

describe('perpetualMotion', () => {
  describe('AXIS enum', () => {
    it('should have the correct values', () => {
      expect(AXIS.X).toBe('x')
      expect(AXIS.Y).toBe('y')
      expect(AXIS.Z).toBe('z')
    })
  })

  describe('perpetualMotions API', () => {
    it('should have the expected methods', () => {
      expect(perpetualMotions).toBeDefined()
      expect(typeof perpetualMotions.startRotation).toBe('function')
      expect(typeof perpetualMotions.stopRotation).toBe('function')
      expect(typeof perpetualMotions.smoothRotation).toBe('function')
    })

    it('should call startRotation without errors', () => {
      const rotationVelocity = { x: 10, y: 20, z: 30, w: 1 }; // Mock quaternion

      expect(() => {
        perpetualMotions.startRotation(mockEntity, rotationVelocity);
      }).not.toThrow();
    })

    it('should call stopRotation without errors', () => {
      expect(() => {
        perpetualMotions.stopRotation(mockEntity);
      }).not.toThrow();
    })

    it('should call smoothRotation with default axis without errors', () => {
      expect(() => {
        perpetualMotions.smoothRotation(mockEntity, 2); // duration of 2 seconds
      }).not.toThrow();
    })

    it('should call smoothRotation with X axis without errors', () => {
      expect(() => {
        perpetualMotions.smoothRotation(mockEntity, 2, AXIS.X);
      }).not.toThrow();
    })

    it('should call smoothRotation with Y axis without errors', () => {
      expect(() => {
        perpetualMotions.smoothRotation(mockEntity, 2, AXIS.Y);
      }).not.toThrow();
    })

    it('should call smoothRotation with Z axis without errors', () => {
      expect(() => {
        perpetualMotions.smoothRotation(mockEntity, 2, AXIS.Z);
      }).not.toThrow();
    })
  })
})