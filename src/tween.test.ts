/// <reference types="jest" />

// Mock setup must be at the top before any imports
const actualEcs = jest.requireActual("@dcl/sdk/ecs");

jest.mock("@dcl/sdk/ecs", () => {
  const mockEngine = {
    addSystem: jest.fn(),
    getEntityState: jest.fn(() => "Active"),
  };

  const mockTween = {
    has: jest.fn(() => true),
    get: jest.fn(() => ({ duration: 1000, currentTime: 0 })),
    deleteFrom: jest.fn(),
    createOrReplace: jest.fn(),
    Mode: {
      Move: jest.fn(({ start, end }) => ({ start, end })),
      Rotate: jest.fn(({ start, end }) => ({ start, end })),
      Scale: jest.fn(({ start, end }) => ({ start, end })),
    }
  };

  return {
    ...actualEcs,
    engine: mockEngine,
    Entity: Number,
    IEngine: jest.fn(),
    EntityState: {
      Removed: "Removed",
      UsedEntity: "UsedEntity"
    },
    Tween: mockTween
  };
});

jest.mock('./helpers', () => ({
  getEasingFunctionFromInterpolation: jest.fn(() => () => 0)
}));

// Import after mocking
import * as ecs from "@dcl/sdk/ecs";
import { Entity, engine } from "@dcl/sdk/ecs";
import { tweens } from "./tween";
import { InterpolationType } from "./math";
import { priority } from "./priority";

describe("tweens", () => {
  let mockEntity: Entity;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockEntity = 1 as Entity;
  });

  // System registration happens at module load time when the singleton is created
  // Testing the functionality is more important than the registration itself

  describe("startTranslation", () => {
    it("should create a translation tween with provided parameters", () => {
      const start = { x: 0, y: 0, z: 0 };
      const end = { x: 1, y: 1, z: 1 };
      const duration = 2;
      const interpolationType = InterpolationType.LINEAR;

      tweens.startTranslation(
        mockEntity,
        start,
        end,
        duration,
        interpolationType
      );

      expect(ecs.Tween.createOrReplace).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          duration: duration * 1000,
          currentTime: 0,
        })
      );
    });

    it("should use default interpolation type when not provided", () => {
      const start = { x: 0, y: 0, z: 0 };
      const end = { x: 1, y: 1, z: 1 };
      const duration = 2;

      tweens.startTranslation(mockEntity, start, end, duration);

      expect(ecs.Tween.createOrReplace).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          duration: duration * 1000,
          currentTime: 0,
        })
      );
    });

    it("should handle duration of 0 correctly", () => {
      const start = { x: 0, y: 0, z: 0 };
      const end = { x: 1, y: 1, z: 1 };
      const duration = 0;

      tweens.startTranslation(mockEntity, start, end, duration);

      expect(ecs.Tween.createOrReplace).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          currentTime: 1, // Should start at 1 when duration is 0
        })
      );
    });
  });

  describe("startRotation", () => {
    it("should create a rotation tween with provided parameters", () => {
      const start = { x: 0, y: 0, z: 0, w: 1 };
      const end = { x: 0, y: 0, z: 0, w: 1 };
      const duration = 2;

      tweens.startRotation(mockEntity, start, end, duration);

      expect(ecs.Tween.createOrReplace).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          duration: duration * 1000,
          mode: expect.objectContaining({ start, end }),
        })
      );
    });
  });

  describe("startScaling", () => {
    it("should create a scaling tween with provided parameters", () => {
      const start = { x: 1, y: 1, z: 1 };
      const end = { x: 2, y: 2, z: 2 };
      const duration = 2;

      tweens.startScaling(mockEntity, start, end, duration);

      expect(ecs.Tween.createOrReplace).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          duration: duration * 1000,
          mode: expect.objectContaining({ start, end }),
        })
      );
    });
  });

  describe("stop functions", () => {
    it("should stop translation tween", () => {
      const start = { x: 0, y: 0, z: 0 };
      const end = { x: 1, y: 1, z: 1 };
      const duration = 2;

      // Start a tween
      tweens.startTranslation(mockEntity, start, end, duration);

      // Stop it
      tweens.stopTranslation(mockEntity);

      expect(ecs.Tween.deleteFrom).toHaveBeenCalledWith(mockEntity);
    });

    it("should stop rotation tween", () => {
      const start = { x: 0, y: 0, z: 0, w: 1 };
      const end = { x: 0, y: 0, z: 0, w: 1 };
      const duration = 2;

      // Start a tween
      tweens.startRotation(mockEntity, start, end, duration);

      // Stop it
      tweens.stopRotation(mockEntity);

      expect(ecs.Tween.deleteFrom).toHaveBeenCalledWith(mockEntity);
    });

    it("should stop scaling tween", () => {
      const start = { x: 1, y: 1, z: 1 };
      const end = { x: 2, y: 2, z: 2 };
      const duration = 2;

      // Start a tween
      tweens.startScaling(mockEntity, start, end, duration);

      // Stop it
      tweens.stopScaling(mockEntity);

      expect(ecs.Tween.deleteFrom).toHaveBeenCalledWith(mockEntity);
    });
  });

  describe("getOnFinishCallback", () => {
    it("should get translation callback for registered entity", () => {
      const start = { x: 0, y: 0, z: 0 };
      const end = { x: 1, y: 1, z: 1 };
      const duration = 2;
      const callback = jest.fn();

      tweens.startTranslation(mockEntity, start, end, duration, InterpolationType.LINEAR, callback);

      // This should not throw because the entity is registered
      expect(() => tweens.getTranslationOnFinishCallback(mockEntity)).not.toThrow();
    });

    it("should throw error for unregistered entity", () => {
      const unregisteredEntity = 999 as Entity; // Unregistered entity

      expect(() => tweens.getTranslationOnFinishCallback(unregisteredEntity))
        .toThrow(`Entity ${unregisteredEntity} is not registered with tweens system`);
    });

    it("should work for rotation callbacks", () => {
      const start = { x: 0, y: 0, z: 0, w: 1 };
      const end = { x: 0, y: 0, z: 0, w: 1 };
      const duration = 2;
      const callback = jest.fn();

      tweens.startRotation(mockEntity, start, end, duration, InterpolationType.LINEAR, callback);

      expect(() => tweens.getRotationOnFinishCallback(mockEntity)).not.toThrow();
    });

    it("should work for scaling callbacks", () => {
      const start = { x: 1, y: 1, z: 1 };
      const end = { x: 2, y: 2, z: 2 };
      const duration = 2;
      const callback = jest.fn();

      tweens.startScaling(mockEntity, start, end, duration, InterpolationType.LINEAR, callback);

      expect(() => tweens.getScalingOnFinishCallback(mockEntity)).not.toThrow();
    });
  });
});