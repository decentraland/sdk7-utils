/// <reference types="jest" />

// Mock external dependencies before importing the module under test
jest.mock('@dcl/sdk/ecs', () => {
  // Create a mock engine
  const mockEngine = {
    addEntity: jest.fn(() => Math.floor(Math.random() * 1000) as number as Entity),
    removeEntity: jest.fn(),
    getEntityState: jest.fn(() => 0), // 0 would represent an idle state
    addSystem: jest.fn(),
  };

  return {
    engine: mockEngine,
    Entity: Number,
    EntityState: {
      Removed: 2,
      Idle: 0,
      Active: 1
    },
    Transform: {
      createOrReplace: jest.fn(),
      create: jest.fn()
    },
    Material: {
      setPbrMaterial: jest.fn(),
    },
    MeshRenderer: {
      setBox: jest.fn(),
      setSphere: jest.fn()
    },
    TriggerArea: {
      setBox: jest.fn(),
      setSphere: jest.fn()
    },
    triggerAreaEventsSystem: {
      onTriggerEnter: jest.fn(),
      onTriggerExit: jest.fn()
    },
    ColliderLayer: {
      CL_CUSTOM1: 1,
      CL_CUSTOM2: 2,
      CL_CUSTOM3: 4,
      CL_CUSTOM4: 8,
      CL_CUSTOM5: 16,
      CL_CUSTOM6: 32,
      CL_CUSTOM7: 64,
      CL_CUSTOM8: 128,
      CL_NONE: 0,
      CL_PLAYER: 256
    }
  };
});

jest.mock('@dcl/sdk/math', () => ({
  Vector3: {
    Zero: () => ({ x: 0, y: 0, z: 0 }),
    One: () => ({ x: 1, y: 1, z: 1 }),
    add: (a: any, b: any) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
    rotate: (v: any, q: any) => v, // Simplified
    create: (x: number, y: number, z: number) => ({ x, y, z })
  },
  Color4: {
    fromInts: (r: number, g: number, b: number, a: number) => ({ r, g, b, a })
  },
  Color3: {
    Red: () => ({ r: 1, g: 0, b: 0 }),
    Black: () => ({ r: 0, g: 0, b: 0 }),
    Blue: () => ({ r: 0, g: 0, b: 1 }),
    create: (r: number, g: number, b: number) => ({ r, g, b })
  },
  Quaternion: {
    Identity: () => ({ x: 0, y: 0, z: 0, w: 1 })
  }
}));

// Mock the priority module to match the actual values
jest.mock('./priority', () => {
  const REGULAR_PRIORITY = 100e3;
  return {
    priority: {
      TimerSystemPriority: REGULAR_PRIORITY + 256,
      TweenSystemPriority: REGULAR_PRIORITY + 192,
      PerpetualMotionSystemPriority: REGULAR_PRIORITY + 192,
      PathSystemPriority: REGULAR_PRIORITY + 192,
      TriggerSystemPriority: REGULAR_PRIORITY + 128,
      ActionSystemPriority: REGULAR_PRIORITY + 64
    }
  };
});

// Mock the math module functions
jest.mock('./math', () => ({
  getWorldPosition: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
  getWorldRotation: jest.fn(() => ({ x: 0, y: 0, z: 0, w: 1 }))
}));

import { engine, Entity, IEngine, EntityState } from '@dcl/sdk/ecs';
import { Vector3, Color3 } from '@dcl/sdk/math';
import { triggers, TriggerAreaSpec, LAYER_1, LAYER_2, LAYER_3, LAYER_4, LAYER_5, LAYER_6, LAYER_7, LAYER_8, ALL_LAYERS, NO_LAYERS, PLAYER_LAYER_ID, Triggers } from './trigger';

// Get the mocked engine
const mockedEngine = (engine as any);

describe('Trigger System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mocked engine state to default
    mockedEngine.getEntityState.mockReturnValue(0); // Idle state
  });

  describe('Layer constants', () => {
    test('should define layer constants correctly', () => {
      expect(LAYER_1).toBe(1);
      expect(LAYER_2).toBe(2);
      expect(LAYER_3).toBe(4);
      expect(LAYER_4).toBe(8);
      expect(LAYER_5).toBe(16);
      expect(LAYER_6).toBe(32);
      expect(LAYER_7).toBe(64);
      expect(LAYER_8).toBe(128);
      expect(ALL_LAYERS).toBe(255);
      expect(NO_LAYERS).toBe(0);
      expect(PLAYER_LAYER_ID).toBe(LAYER_1); // Default to LAYER_1
    });
  });

  describe('addTrigger and removeTrigger', () => {
    test('should add a trigger with default values', () => {
      const entity = 1 as Entity;
      triggers.addTrigger(entity);
      
      expect(triggers.isTriggerEnabled(entity)).toBe(true);
      expect(triggers.getLayerMask(entity)).toBe(NO_LAYERS);
      expect(triggers.getTriggeredByMask(entity)).toBe(NO_LAYERS);
      expect(triggers.getAreas(entity)).toEqual([{ type: 'box' }]);
    });

    test('should add a trigger with custom values', () => {
      const entity = 2 as Entity;
      const customAreas: TriggerAreaSpec[] = [
        { type: 'sphere', radius: 5 },
        { type: 'box', position: Vector3.One(), scale: Vector3.One() }
      ];
      const onEnterCallback = jest.fn();
      const onExitCallback = jest.fn();
      
      triggers.addTrigger(
        entity,
        LAYER_1,
        LAYER_2,
        customAreas,
        onEnterCallback,
        onExitCallback,
        Color3.Red()
      );
      
      expect(triggers.getLayerMask(entity)).toBe(LAYER_1);
      expect(triggers.getTriggeredByMask(entity)).toBe(LAYER_2);
      expect(triggers.getAreas(entity)).toEqual(customAreas);
    });

    test('should validate layerMask values', () => {
      const entity = 3 as Entity;
      
      expect(() => {
        triggers.addTrigger(entity, -1);
      }).toThrow(`Bad layerMask: -1. Expected a non-negative integer no greater than ${ALL_LAYERS}`);
      
      expect(() => {
        triggers.addTrigger(entity, ALL_LAYERS + 1);
      }).toThrow(`Bad layerMask: ${ALL_LAYERS + 1}. Expected a non-negative integer no greater than ${ALL_LAYERS}`);
    });

    test('should validate triggeredByMask values', () => {
      const entity = 4 as Entity;
      
      expect(() => {
        triggers.addTrigger(entity, NO_LAYERS, -1);
      }).toThrow(`Bad triggeredByMask: -1. Expected a non-negative integer no greater than ${ALL_LAYERS}`);
      
      expect(() => {
        triggers.addTrigger(entity, NO_LAYERS, ALL_LAYERS + 1);
      }).toThrow(`Bad triggeredByMask: ${ALL_LAYERS + 1}. Expected a non-negative integer no greater than ${ALL_LAYERS}`);
    });

    test('should remove a trigger', () => {
      const entity = 5 as Entity;
      triggers.addTrigger(entity);
      
      expect(triggers.isTriggerEnabled(entity)).toBe(true);
      
      triggers.removeTrigger(entity);
      
      expect(triggers.isTriggerEnabled(entity)).toBe(false);
      expect(triggers.getLayerMask(entity)).toBe(NO_LAYERS);
    });
  });

  describe('oneTimeTrigger', () => {
    test('should create a one-time trigger', () => {
      const entity = 6 as Entity;
      const onEnterCallback = jest.fn();
      
      triggers.oneTimeTrigger(
        entity,
        LAYER_1,
        LAYER_2,
        [{ type: 'box' }],
        onEnterCallback
      );
      
      // The trigger should be added initially
      expect(triggers.isTriggerEnabled(entity)).toBe(true);
      
      // In the real system, the trigger would be removed after one activation
      // For this test, we're verifying that the one-time setup is correct
      // Since we can't fully simulate the ECS events, we'll verify through other means
      
      // We can verify that the trigger was set up properly by checking that
      // a subsequent call to oneTimeTrigger works without error
    });
  });

  describe('enableTrigger and isTriggerEnabled', () => {
    test('should enable and disable triggers', () => {
      const entity = 7 as Entity;
      triggers.addTrigger(entity);
      
      expect(triggers.isTriggerEnabled(entity)).toBe(true);
      
      triggers.enableTrigger(entity, false);
      expect(triggers.isTriggerEnabled(entity)).toBe(false);
      
      triggers.enableTrigger(entity, true);
      expect(triggers.isTriggerEnabled(entity)).toBe(true);
    });

    test('should not modify non-existent triggers', () => {
      const entity = 999 as Entity; // Non-existent entity
      
      expect(triggers.isTriggerEnabled(entity)).toBe(false);
      
      triggers.enableTrigger(entity, false);
      expect(triggers.isTriggerEnabled(entity)).toBe(false);
    });
  });

  describe('Layer mask operations', () => {
    test('should get and set layer mask', () => {
      const entity = 8 as Entity;
      triggers.addTrigger(entity);
      
      expect(triggers.getLayerMask(entity)).toBe(NO_LAYERS);
      
      triggers.setLayerMask(entity, LAYER_3);
      expect(triggers.getLayerMask(entity)).toBe(LAYER_3);
    });

    test('should validate layer mask values', () => {
      const entity = 9 as Entity;
      triggers.addTrigger(entity);
      
      expect(() => {
        triggers.setLayerMask(entity, -1);
      }).toThrow(`Bad layerMask: -1. Expected a non-negative integer no greater than ${ALL_LAYERS}`);
      
      expect(() => {
        triggers.setLayerMask(entity, ALL_LAYERS + 1);
      }).toThrow(`Bad layerMask: ${ALL_LAYERS + 1}. Expected a non-negative integer no greater than ${ALL_LAYERS}`);
    });

    test('should get and set triggeredBy mask', () => {
      const entity = 10 as Entity;
      triggers.addTrigger(entity);
      
      expect(triggers.getTriggeredByMask(entity)).toBe(NO_LAYERS);
      
      triggers.setTriggeredByMask(entity, LAYER_4);
      expect(triggers.getTriggeredByMask(entity)).toBe(LAYER_4);
    });

    test('should validate triggeredBy mask values', () => {
      const entity = 11 as Entity;
      triggers.addTrigger(entity);
      
      expect(() => {
        triggers.setTriggeredByMask(entity, -1);
      }).toThrow(`Bad layerMask: -1. Expected a non-negative integer no greater than ${ALL_LAYERS}`);
      
      expect(() => {
        triggers.setTriggeredByMask(entity, ALL_LAYERS + 1);
      }).toThrow(`Bad layerMask: ${ALL_LAYERS + 1}. Expected a non-negative integer no greater than ${ALL_LAYERS}`);
    });
  });

  describe('Area operations', () => {
    test('should get and set areas', () => {
      const entity = 12 as Entity;
      const initialAreas: TriggerAreaSpec[] = [{ type: 'box' }];
      triggers.addTrigger(entity, NO_LAYERS, NO_LAYERS, initialAreas);
      
      expect(triggers.getAreas(entity)).toEqual(initialAreas);
      
      const newAreas: TriggerAreaSpec[] = [
        { type: 'sphere', radius: 5 },
        { type: 'box', position: Vector3.One(), scale: Vector3.One() }
      ];
      triggers.setAreas(entity, newAreas);
      
      expect(triggers.getAreas(entity)).toEqual(newAreas);
    });
  });

  describe('Callback operations', () => {
    test('should set onEnter callback', () => {
      const entity = 13 as Entity;
      const callback = jest.fn();
      triggers.addTrigger(entity);
      
      triggers.setOnEnterCallback(entity, callback);
      
      // Verify it doesn't throw
      expect(() => triggers.setOnEnterCallback(entity, callback)).not.toThrow();
    });

    test('should set onExit callback', () => {
      const entity = 14 as Entity;
      const callback = jest.fn();
      triggers.addTrigger(entity);
      
      triggers.setOnExitCallback(entity, callback);
      
      // Verify it doesn't throw
      expect(() => triggers.setOnExitCallback(entity, callback)).not.toThrow();
    });
  });

  describe('Debug drawing', () => {
    test('should enable and check debug draw', () => {
      expect(triggers.isDebugDrawEnabled()).toBe(false);
      
      triggers.enableDebugDraw(true);
      expect(triggers.isDebugDrawEnabled()).toBe(true);
      
      triggers.enableDebugDraw(false);
      expect(triggers.isDebugDrawEnabled()).toBe(false);
    });
  });
});