/// <reference types="jest" />
import { priority } from './priority'

describe('Priority Module', () => {
  const REGULAR_PRIORITY = 100e3 // 100000

  describe('priority namespace constants', () => {
    test('should have correct TimerSystemPriority value', () => {
      expect(priority.TimerSystemPriority).toBe(REGULAR_PRIORITY + 256) // 100256
    })

    test('should have correct TweenSystemPriority value', () => {
      expect(priority.TweenSystemPriority).toBe(REGULAR_PRIORITY + 192) // 100192
    })

    test('should have correct PerpetualMotionSystemPriority value', () => {
      expect(priority.PerpetualMotionSystemPriority).toBe(REGULAR_PRIORITY + 192) // 100192
    })

    test('should have correct PathSystemPriority value', () => {
      expect(priority.PathSystemPriority).toBe(REGULAR_PRIORITY + 192) // 100192
    })

    test('should have correct TriggerSystemPriority value', () => {
      expect(priority.TriggerSystemPriority).toBe(REGULAR_PRIORITY + 128) // 100128
    })

    test('should have correct ActionSystemPriority value', () => {
      expect(priority.ActionSystemPriority).toBe(REGULAR_PRIORITY + 64) // 100064
    })

    test('should have expected relative priority relationships', () => {
      // Timer system should have highest priority
      expect(priority.TimerSystemPriority).toBeGreaterThan(priority.TweenSystemPriority)
      expect(priority.TimerSystemPriority).toBeGreaterThan(priority.PathSystemPriority)
      expect(priority.TimerSystemPriority).toBeGreaterThan(priority.TriggerSystemPriority)
      expect(priority.TimerSystemPriority).toBeGreaterThan(priority.ActionSystemPriority)

      // Tween, PerpetualMotion, and Path systems should have the same priority
      expect(priority.TweenSystemPriority).toBe(priority.PerpetualMotionSystemPriority)
      expect(priority.TweenSystemPriority).toBe(priority.PathSystemPriority)

      // Trigger should be lower than Tween/PerpetualMotion/Path but higher than Action
      expect(priority.TriggerSystemPriority).toBeLessThan(priority.TweenSystemPriority)
      expect(priority.TriggerSystemPriority).toBeGreaterThan(priority.ActionSystemPriority)

      // Action should have the lowest priority
      expect(priority.ActionSystemPriority).toBeLessThan(priority.TriggerSystemPriority)
      expect(priority.ActionSystemPriority).toBeLessThan(priority.TweenSystemPriority)
      expect(priority.ActionSystemPriority).toBeLessThan(priority.PathSystemPriority)
    })
  })
})