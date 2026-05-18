/// <reference types="jest" />

// Mock the DCL SDK modules before importing the functions under test
jest.mock('@dcl/sdk/ecs', () => {
  // Define a mock engine
  const mockComponent = {
    getMutable: jest.fn(),
    createOrReplace: jest.fn(),
    has: jest.fn().mockReturnValue(true),
    deleteFrom: jest.fn()
  };
  
  const mockEngine = {
    defineComponent: jest.fn(() => mockComponent),
    getEntityState: jest.fn().mockReturnValue(undefined),
    addSystem: jest.fn(),
    registerEntity: jest.fn(() => Math.floor(Math.random() * 1000) as any),
    removeEntity: jest.fn()
  };
  
  return {
    engine: mockEngine,
    Entity: { __entity_type: "" },
    EntityState: { Removed: 'removed' },
    IEngine: Object,
    Schemas: {
      Array: jest.fn(schema => schema),
      Boolean: Boolean,
      Number: Number,
      Vector3: {}
    },
    Transform: {
      getMutable: jest.fn(() => ({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } })),
      has: jest.fn(() => true)
    }
  }
});

// Mock math functions
jest.mock('@dcl/sdk/math', () => {
  return {
    Vector3: {
      subtract: jest.fn((a: any, b: any) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })),
      lerp: jest.fn((start: any, end: any, t: number) => ({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        z: start.z + (end.z - start.z) * t
      })),
      distance: jest.fn((a: any, b: any) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2))),
      equals: jest.fn((a: any, b: any) => a.x === b.x && a.y === b.y && a.z === b.z),
      clone: jest.fn((v: any) => ({ x: v.x, y: v.y, z: v.z })),
      catmullRom: jest.fn((v0: any, v1: any, v2: any, v3: any, t: number) => {
        // Simplified Catmull-Rom interpolation
        const t2 = t * t;
        const t3 = t2 * t;
        const c0 = -0.5 * t3 + t2 - 0.5 * t;
        const c1 = 1.5 * t3 - 2.5 * t2 + 1.0;
        const c2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
        const c3 = 0.5 * t3 - 0.5 * t2;

        return {
          x: c0 * v0.x + c1 * v1.x + c2 * v2.x + c3 * v3.x,
          y: c0 * v0.y + c1 * v1.y + c2 * v2.y + c3 * v3.y,
          z: c0 * v0.z + c1 * v1.z + c2 * v2.z + c3 * v3.z
        };
      })
    },
    Quaternion: {
      lookRotation: jest.fn(() => ({ x: 0, y: 0, z: 0, w: 1 }))
    },
    Scalar: {
      clamp: jest.fn((v: number, min: number, max: number) => Math.min(Math.max(v, min), max))
    }
  }
});

import { Entity } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { paths } from './path'

// Create unique mock entities for tests
let entityCounter = 0;
const createMockEntity = (): Entity => {
  return { __entity_type: `entity_${entityCounter++}` } as unknown as Entity;
};

describe('Path System', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    entityCounter = 0;
  });

  describe('startStraightPath', () => {
    it('should start a straight path for an entity', () => {
      const entity = createMockEntity();
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 1, z: 0 }
      ];
      const duration = 2;

      expect(() => {
        paths.startStraightPath(entity, points, duration);
      }).not.toThrow();
    });

    it('should throw an error if less than 2 points are provided', () => {
      const entity = createMockEntity();
      const points = [{ x: 0, y: 0, z: 0 }];
      const duration = 2;

      expect(() => {
        paths.startStraightPath(entity, points, duration);
      }).toThrow('At least 2 points are required to form a path.');
    });

    it('should throw an error if duration is zero', () => {
      const entity = createMockEntity();
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 }
      ];
      const duration = 0;

      expect(() => {
        paths.startStraightPath(entity, points, duration);
      }).toThrow('Path duration must not be zero');
    });

    it('should accept a faceDirection option', () => {
      const entity = createMockEntity();
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 }
      ];
      const duration = 2;

      expect(() => {
        paths.startStraightPath(entity, points, duration, true);
      }).not.toThrow();
    });

    it('should accept onFinish and onPointReached callbacks', () => {
      const entity = createMockEntity();
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 }
      ];
      const duration = 2;
      const onFinish = jest.fn();
      const onPointReached = jest.fn();

      expect(() => {
        paths.startStraightPath(entity, points, duration, false, onFinish, onPointReached);
      }).not.toThrow();
    });
  });

  describe('startSmoothPath', () => {
    it('should start a smooth path for an entity', () => {
      const entity = createMockEntity();
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 1, z: 0 }
      ];
      const duration = 2;
      const segmentCount = 5;

      expect(() => {
        paths.startSmoothPath(entity, points, duration, segmentCount);
      }).not.toThrow();
    });

    it('should throw an error if segmentCount is less than 2', () => {
      const entity = createMockEntity();
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 }
      ];
      const duration = 2;
      const segmentCount = 1;

      expect(() => {
        paths.startSmoothPath(entity, points, duration, segmentCount);
      }).toThrow('segmentCount must be an integer that is greater than 2, got: 1');
    });

    it('should throw an error if segmentCount is not an integer', () => {
      const entity = createMockEntity();
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 }
      ];
      const duration = 2;
      const segmentCount = 2.5;

      expect(() => {
        paths.startSmoothPath(entity, points, duration, segmentCount);
      }).toThrow('segmentCount must be an integer that is greater than 2, got: 2.5');
    });

    it('should throw an error if segmentCount is not an integer (NaN)', () => {
      const entity = createMockEntity();
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 }
      ];
      const duration = 2;
      const segmentCount = NaN;

      expect(() => {
        paths.startSmoothPath(entity, points, duration, segmentCount);
      }).toThrow('segmentCount must be an integer that is greater than 2, got: NaN');
    });

    it('should accept all options', () => {
      const entity = createMockEntity();
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 }
      ];
      const duration = 2;
      const segmentCount = 5;
      const faceDirection = true;
      const onFinish = jest.fn();
      const onPointReached = jest.fn();

      expect(() => {
        paths.startSmoothPath(entity, points, duration, segmentCount, faceDirection, onFinish, onPointReached);
      }).not.toThrow();
    });
  });

  describe('stopPath', () => {
    it('should stop path for an entity', () => {
      const entity = createMockEntity();
      
      // First start a path
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 }
      ];
      paths.startStraightPath(entity, points, 2);
      
      // Then stop it
      expect(() => {
        paths.stopPath(entity);
      }).not.toThrow();
    });
  });

  describe('getOnFinishCallback', () => {
    it('should return the onFinish callback for an entity', () => {
      const entity = createMockEntity();
      const onFinish = jest.fn();
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 }
      ];

      paths.startStraightPath(entity, points, 2, false, onFinish);
      
      expect(() => {
        paths.getOnFinishCallback(entity);
      }).not.toThrow();
    });

    it('should throw an error if entity is not registered', () => {
      // Create an entity that was never registered
      const entity = createMockEntity();
      
      expect(() => {
        paths.getOnFinishCallback(entity);
      }).toThrow(/is not registered in triggers system/);
    });
  });

  describe('path completion behavior', () => {
    it('should handle path completion scenarios', () => {
      const entity = createMockEntity();
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 }
      ];
      const duration = 0.1; // Short duration for quick completion
      
      const onFinish = jest.fn();
      
      paths.startStraightPath(entity, points, duration, false, onFinish);
      
      expect(onFinish).not.toHaveBeenCalled();
    });
  });
});