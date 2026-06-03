/// <reference types="jest" />

// Mock the DCL SDK modules before importing the functions under test
jest.mock('@dcl/sdk/ecs', () => {
  // We'll create a mock transform system during tests
  const mockTransforms = new Map()
  
  return {
    Transform: {
      get: (entity: any) => {
        if (!mockTransforms.has(entity)) {
          throw new Error(`Transform for entity ${entity} not found`)
        }
        return mockTransforms.get(entity)
      },
      getOrNull: (entity: any) => mockTransforms.get(entity) || null,
      create: (entity: any, data?: any) => {
        const transform = {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
          parent: undefined,
          ...data
        }
        mockTransforms.set(entity, transform)
        return transform
      },
      delete: (entity: any) => {
        mockTransforms.delete(entity)
      }
    }
  }
})

jest.mock('@dcl/sdk/math', () => ({
  Vector3: {
    Zero: () => ({ x: 0, y: 0, z: 0 }),
    clone: (v: any) => ({ x: v.x, y: v.y, z: v.z }),
    add: (a: any, b: any) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
    rotate: (v: any, q: any) => ({ x: v.x, y: v.y, z: v.z }), // Simplified
    distanceSquared: (a: any, b: any) => {
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dz = a.z - b.z
      return dx * dx + dy * dy + dz * dz
    },
    catmullRom: (v0: any, v1: any, v2: any, v3: any, t: number) => {
      // Simplified Catmull-Rom interpolation
      const t2 = t * t
      const t3 = t2 * t
      
      return {
        x: 0.5 * (
          (2 * v1.x) +
          (-v0.x + v2.x) * t +
          (2 * v0.x - 5 * v1.x + 4 * v2.x - v3.x) * t2 +
          (-v0.x + 3 * v1.x - 3 * v2.x + v3.x) * t3
        ),
        y: 0.5 * (
          (2 * v1.y) +
          (-v0.y + v2.y) * t +
          (2 * v0.y - 5 * v1.y + 4 * v2.y - v3.y) * t2 +
          (-v0.y + 3 * v1.y - 3 * v2.y + v3.y) * t3
        ),
        z: 0.5 * (
          (2 * v1.z) +
          (-v0.z + v2.z) * t +
          (2 * v0.z - 5 * v1.z + 4 * v2.z - v3.z) * t2 +
          (-v0.z + 3 * v1.z - 3 * v2.z + v3.z) * t3
        )
      }
    }
  },
  Quaternion: {
    Identity: () => ({ x: 0, y: 0, z: 0, w: 1 })
  }
}))

import { Entity, Transform } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { 
  remap, 
  getWorldPosition, 
  getWorldRotation, 
  InterpolationType, 
  interpolate, 
  createCatmullRomSpline,
  areAABBIntersecting,
  areSpheresIntersecting,
  areAABBSphereIntersecting
} from './math'

describe('math.ts', () => {
  beforeEach(() => {
    // Reset any mock transforms between tests
    jest.clearAllMocks()
  })

  describe('remap', () => {
    test('should remap values from one range to another', () => {
      expect(remap(5, 0, 10, 0, 100)).toBe(50) // 5 of 0-10 is 50 of 0-100
      expect(remap(0, 0, 10, 0, 100)).toBe(0)  // 0 of 0-10 is 0 of 0-100
      expect(remap(10, 0, 10, 0, 100)).toBe(100) // 10 of 0-10 is 100 of 0-100
      expect(remap(2.5, 0, 10, 0, 4)).toBe(1)  // 2.5 of 0-10 is 1 of 0-4
    })

    test('should work with negative ranges', () => {
      expect(remap(5, 0, 10, -50, 50)).toBe(0) // 5 of 0-10 is 0 of -50 to 50
      expect(remap(0, 0, 10, -50, 50)).toBe(-50) // 0 of 0-10 is -50 of -50 to 50
      expect(remap(10, 0, 10, -50, 50)).toBe(50) // 10 of 0-10 is 50 of -50 to 50
    })
  })

  describe('getWorldPosition', () => {
    test('should return zero when no transform exists', () => {
      const mockEcs = jest.requireMock('@dcl/sdk/ecs')
      jest.spyOn(mockEcs.Transform, 'getOrNull').mockReturnValue(null)
      
      const mockEntity = 1 as Entity
      expect(getWorldPosition(mockEntity)).toEqual({ x: 0, y: 0, z: 0 })
    })

    test('should return local position when no parent exists', () => {
      const mockEcs = jest.requireMock('@dcl/sdk/ecs')
      const localPos = { x: 1, y: 2, z: 3 }
      jest.spyOn(mockEcs.Transform, 'getOrNull').mockReturnValue({
        position: localPos,
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
        parent: undefined
      })
      
      const mockEntity = 1 as Entity
      expect(getWorldPosition(mockEntity)).toEqual(localPos)
    })
  })

  describe('getWorldRotation', () => {
    test('should return identity when no transform exists', () => {
      const mockEcs = jest.requireMock('@dcl/sdk/ecs')
      jest.spyOn(mockEcs.Transform, 'getOrNull').mockReturnValue(null)
      
      const mockEntity = 1 as Entity
      expect(getWorldRotation(mockEntity)).toEqual({ x: 0, y: 0, z: 0, w: 1 })
    })

    test('should return local rotation when no parent exists', () => {
      const mockEcs = jest.requireMock('@dcl/sdk/ecs')
      const localRot = { x: 0.1, y: 0.2, z: 0.3, w: 0.9 }
      jest.spyOn(mockEcs.Transform, 'getOrNull').mockReturnValue({
        position: { x: 0, y: 0, z: 0 },
        rotation: localRot,
        scale: { x: 1, y: 1, z: 1 },
        parent: undefined
      })
      
      const mockEntity = 1 as Entity
      expect(getWorldRotation(mockEntity)).toEqual(localRot)
    })
  })

  describe('interpolate', () => {
    test('handles LINEAR interpolation', () => {
      expect(interpolate(InterpolationType.LINEAR, 0)).toBe(0)
      expect(interpolate(InterpolationType.LINEAR, 0.5)).toBe(0.5)
      expect(interpolate(InterpolationType.LINEAR, 1)).toBe(1)
    })

    test('handles EASEINQUAD interpolation', () => {
      expect(interpolate(InterpolationType.EASEINQUAD, 0)).toBe(0)
      expect(interpolate(InterpolationType.EASEINQUAD, 1)).toBeCloseTo(1, 5)
      expect(interpolate(InterpolationType.EASEINQUAD, 0.5)).toBeCloseTo(0.25, 5)
    })

    test('handles EASEOUTQUAD interpolation', () => {
      expect(interpolate(InterpolationType.EASEOUTQUAD, 0)).toBe(0)
      expect(interpolate(InterpolationType.EASEOUTQUAD, 1)).toBe(1)
      expect(interpolate(InterpolationType.EASEOUTQUAD, 0.5)).toBeCloseTo(0.75, 5)
    })

    test('handles EASEQUAD interpolation', () => {
      expect(interpolate(InterpolationType.EASEQUAD, 0)).toBe(0)
      expect(interpolate(InterpolationType.EASEQUAD, 1)).toBe(1)
      expect(interpolate(InterpolationType.EASEQUAD, 0.5)).toBe(0.5)
    })

    test('handles EASEINSINE interpolation', () => {
      expect(interpolate(InterpolationType.EASEINSINE, 0)).toBe(0)
      expect(interpolate(InterpolationType.EASEINSINE, 1)).toBeCloseTo(1, 5)
    })

    test('handles EASEOUTSINE interpolation', () => {
      expect(interpolate(InterpolationType.EASEOUTSINE, 0)).toBe(0)
      expect(interpolate(InterpolationType.EASEOUTSINE, 1)).toBe(1)
    })

    test('handles EASESINE interpolation', () => {
      expect(interpolate(InterpolationType.EASESINE, 0)).toBeCloseTo(0, 5)
      expect(interpolate(InterpolationType.EASESINE, 1)).toBeCloseTo(1, 5)
      expect(interpolate(InterpolationType.EASESINE, 0.5)).toBeCloseTo(0.5, 5)
    })

    test('handles EASEINEXPO interpolation', () => {
      expect(interpolate(InterpolationType.EASEINEXPO, 0)).toBe(0)
      expect(interpolate(InterpolationType.EASEINEXPO, 1)).toBeCloseTo(1, 5)
    })

    test('handles EASEOUTEXPO interpolation', () => {
      expect(interpolate(InterpolationType.EASEOUTEXPO, 0)).toBe(0)
      expect(interpolate(InterpolationType.EASEOUTEXPO, 1)).toBe(1)
    })

    test('handles EASEEXPO interpolation', () => {
      expect(interpolate(InterpolationType.EASEEXPO, 0)).toBe(0)
      expect(interpolate(InterpolationType.EASEEXPO, 1)).toBe(1)
      expect(interpolate(InterpolationType.EASEEXPO, 0.5)).toBeCloseTo(0.5, 5)
    })

    test('handles EASEINELASTIC interpolation', () => {
      expect(interpolate(InterpolationType.EASEINELASTIC, 0)).toBe(0)
      expect(interpolate(InterpolationType.EASEINELASTIC, 1)).toBeCloseTo(1, 5)
    })

    test('handles EASEOUTELASTIC interpolation', () => {
      expect(interpolate(InterpolationType.EASEOUTELASTIC, 0)).toBe(0)
      expect(interpolate(InterpolationType.EASEOUTELASTIC, 1)).toBe(1)
    })

    test('handles EASEELASTIC interpolation', () => {
      expect(interpolate(InterpolationType.EASEELASTIC, 0)).toBe(0)
      expect(interpolate(InterpolationType.EASEELASTIC, 1)).toBe(1)
    })

    test('handles EASEINBOUNCE interpolation', () => {
      expect(interpolate(InterpolationType.EASEINBOUNCE, 0)).toBe(0)
      expect(interpolate(InterpolationType.EASEINBOUNCE, 1)).toBeCloseTo(1, 5)
    })

    test('handles EASEOUTEBOUNCE interpolation', () => {
      expect(interpolate(InterpolationType.EASEOUTEBOUNCE, 0)).toBe(0)
      expect(interpolate(InterpolationType.EASEOUTEBOUNCE, 1)).toBe(1)
    })

    test('handles EASEBOUNCE interpolation', () => {
      expect(interpolate(InterpolationType.EASEBOUNCE, 0)).toBe(0)
      expect(interpolate(InterpolationType.EASEBOUNCE, 1)).toBe(1)
    })

    test('defaults to linear interpolation for invalid type', () => {
      // Testing with a value that doesn't match any InterpolationType
      const invalidType = 'unknown' as any
      expect(interpolate(invalidType, 0.5)).toBe(0.5)
    })
  })

  describe('createCatmullRomSpline', () => {
    test('should create a spline with non-closed path', () => {
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1 },
        { x: 2, y: 0, z: 2 },
        { x: 3, y: 1, z: 3 }
      ]

      const spline = createCatmullRomSpline(points, 10)
      // The implementation might generate different number of points
      expect(spline).toBeInstanceOf(Array)
      expect(spline.length).toBeGreaterThan(0)

      // First point should be approximately the same as the first input point
      expect(spline[0].x).toBeCloseTo(0, 1)
      expect(spline[0].y).toBeCloseTo(0, 1)
      expect(spline[0].z).toBeCloseTo(0, 1)
    })

    test('should create a closed spline', () => {
      const points = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1 },
        { x: 2, y: 0, z: 2 }
      ]

      const spline = createCatmullRomSpline(points, 5, true)
      // For a closed path with 3 points: 3 segments * 5 points = 15 points, plus 1 closing point = 16
      expect(spline).toHaveLength(16)

      // For a closed loop, first and last points should be the same
      if (spline.length > 1) {
        expect(spline[0].x).toBeCloseTo(spline[spline.length - 1].x, 1)
        expect(spline[0].y).toBeCloseTo(spline[spline.length - 1].y, 1)
        expect(spline[0].z).toBeCloseTo(spline[spline.length - 1].z, 1)
      }
    })
  })

  describe('areAABBIntersecting', () => {
    test('should return true when AABBs intersect', () => {
      const aMin = { x: 0, y: 0, z: 0 }
      const aMax = { x: 2, y: 2, z: 2 }
      const bMin = { x: 1, y: 1, z: 1 }
      const bMax = { x: 3, y: 3, z: 3 }

      expect(areAABBIntersecting(aMin, aMax, bMin, bMax)).toBe(true)
    })

    test('should return false when AABBs do not intersect', () => {
      const aMin = { x: 0, y: 0, z: 0 }
      const aMax = { x: 1, y: 1, z: 1 }
      const bMin = { x: 2, y: 2, z: 2 }
      const bMax = { x: 3, y: 3, z: 3 }

      expect(areAABBIntersecting(aMin, aMax, bMin, bMax)).toBe(false)
    })

    test('should return true when AABBs touch at boundaries', () => {
      const aMin = { x: 0, y: 0, z: 0 }
      const aMax = { x: 1, y: 1, z: 1 }
      const bMin = { x: 1, y: 1, z: 1 }
      const bMax = { x: 2, y: 2, z: 2 }

      expect(areAABBIntersecting(aMin, aMax, bMin, bMax)).toBe(true)
    })
  })

  describe('areSpheresIntersecting', () => {
    test('should return true when spheres intersect', () => {
      const aPos = { x: 0, y: 0, z: 0 }
      const aRadius = 1
      const bPos = { x: 1, y: 0, z: 0 }
      const bRadius = 1

      expect(areSpheresIntersecting(aPos, aRadius, bPos, bRadius)).toBe(true)
    })

    test('should return false when spheres do not intersect', () => {
      const aPos = { x: 0, y: 0, z: 0 }
      const aRadius = 1
      const bPos = { x: 3, y: 0, z: 0 }
      const bRadius = 1

      expect(areSpheresIntersecting(aPos, aRadius, bPos, bRadius)).toBe(false)
    })

    test('should return false when spheres touch at boundaries', () => {
      const aPos = { x: 0, y: 0, z: 0 }
      const aRadius = 1
      const bPos = { x: 2, y: 0, z: 0 }
      const bRadius = 1

      expect(areSpheresIntersecting(aPos, aRadius, bPos, bRadius)).toBe(false)
    })
  })

  describe('areAABBSphereIntersecting', () => {
    test('should return true when AABB and sphere intersect', () => {
      const boxMin = { x: 0, y: 0, z: 0 }
      const boxMax = { x: 2, y: 2, z: 2 }
      const spherePos = { x: 1, y: 1, z: 1 }
      const sphereRadius = 0.5

      expect(areAABBSphereIntersecting(boxMin, boxMax, spherePos, sphereRadius)).toBe(true)
    })

    test('should return false when AABB and sphere do not intersect', () => {
      const boxMin = { x: 0, y: 0, z: 0 }
      const boxMax = { x: 1, y: 1, z: 1 }
      const spherePos = { x: 5, y: 5, z: 5 }
      const sphereRadius = 1

      expect(areAABBSphereIntersecting(boxMin, boxMax, spherePos, sphereRadius)).toBe(false)
    })

    test('should return true for intersecting AABB and sphere', () => {
      const boxMin = { x: 0, y: 0, z: 0 }
      const boxMax = { x: 2, y: 2, z: 2 }
      const spherePos = { x: 2.5, y: 1, z: 1 }
      const sphereRadius = 1

      expect(areAABBSphereIntersecting(boxMin, boxMax, spherePos, sphereRadius)).toBe(true)
    })
  })
})