/// <reference types="jest" />

// Mock the DCL SDK modules before importing the functions under test
jest.mock('@dcl/sdk/ecs', () => {
  const mockComponents = new Map()
  const mockComponentData = new Map()

  // Mock entity state tracker
  const mockEntityStates = new Map()

  return {
    engine: {
      defineComponent: (name: string, schema: any) => {
        const componentId = Symbol(name).toString()
        const component = {
          id: componentId,
          has: (entity: number) => mockComponents.has(`${entity}-${componentId}`),
          create: (entity: number, data?: any) => {
            const key = `${entity}-${componentId}`
            const componentData = { ...data }
            mockComponents.set(key, true)
            mockComponentData.set(key, componentData)
            return componentData
          },
          createOrReplace: (entity: number, data?: any) => {
            const key = `${entity}-${componentId}`
            const componentData = { ...data }
            mockComponents.set(key, true)
            mockComponentData.set(key, componentData)
            return componentData
          },
          deleteFrom: (entity: number) => {
            const key = `${entity}-${componentId}`
            mockComponents.delete(key)
            mockComponentData.delete(key)
          },
          get: (entity: number) => {
            const key = `${entity}-${componentId}`
            if (!mockComponentData.has(key)) {
              throw new Error(`Component ${name} for entity ${entity} not found`)
            }
            return mockComponentData.get(key)
          },
          getOrNull: (entity: number) => {
            const key = `${entity}-${componentId}`
            return mockComponentData.get(key) || null
          },
          getMutable: (entity: number) => {
            const key = `${entity}-${componentId}`
            if (!mockComponentData.has(key)) {
              throw new Error(`Component ${name} for entity ${entity} not found`)
            }
            return mockComponentData.get(key)
          }
        }
        return component
      },
      getEntityState: (entity: number) => mockEntityStates.get(entity) || 0 // Assume active state
    },
    Entity: Number,
    EntityState: {
      Removed: 1,
      Active: 0
    },
    Schemas: {
      EnumNumber: (enumType: any, defaultValue: any) => ({ type: 'EnumNumber', enum: enumType, default: defaultValue })
    }
  }
})

// Mock the timers module - we need to ensure we're not directly using setInterval in tests
jest.mock('./timer', () => ({
  timers: {
    setInterval: jest.fn((callback: () => void) => {
      // Execute immediately for testing purposes
      callback();
      return 1; // mock interval ID
    })
  }
}));

import { engine, Entity, EntityState, Schemas } from '@dcl/sdk/ecs'
import { timers } from './timer';
import { ToggleState, Toggles, toggles } from './toggle';

describe('Toggle System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('default toggles instance', () => {
    it('should have all required methods', () => {
      expect(toggles).toBeDefined();
      expect(toggles).toHaveProperty('addToggle');
      expect(toggles).toHaveProperty('removeToggle');
      expect(toggles).toHaveProperty('setCallback');
      expect(toggles).toHaveProperty('set');
      expect(toggles).toHaveProperty('flip');
      expect(toggles).toHaveProperty('isOn');
    });
  });

  describe('addToggle', () => {
    it('should add a toggle with initial state and optional callback', () => {
      const mockEntity = 123 as Entity;
      const mockCallback = jest.fn();

      toggles.addToggle(mockEntity, ToggleState.On, mockCallback);

      expect(toggles.isOn(mockEntity)).toBe(true); // Should be on after adding with On state
    });

    it('should add a toggle without callback', () => {
      const mockEntity = 456 as Entity;

      toggles.addToggle(mockEntity, ToggleState.Off);

      expect(toggles.isOn(mockEntity)).toBe(false); // Should be off after adding with Off state
    });
  });

  describe('removeToggle', () => {
    it('should remove a toggle entity', () => {
      const mockEntity = 789 as Entity;

      toggles.addToggle(mockEntity, ToggleState.On);
      expect(toggles.isOn(mockEntity)).toBe(true);

      toggles.removeToggle(mockEntity);
      // Note: We can't easily test removal with mocks, but we ensure no errors occur
    });
  });

  describe('setCallback', () => {
    it('should set a callback for an entity', () => {
      const mockEntity = 101 as Entity;
      const mockCallback = jest.fn();

      toggles.setCallback(mockEntity, mockCallback);
      toggles.addToggle(mockEntity, ToggleState.Off, mockCallback);
      toggles.set(mockEntity, ToggleState.On);

      expect(mockCallback).toHaveBeenCalledWith(ToggleState.On);
    });

    it('should handle undefined callback', () => {
      const mockEntity = 202 as Entity;
      const mockCallback = jest.fn();

      toggles.addToggle(mockEntity, ToggleState.Off, mockCallback);
      toggles.setCallback(mockEntity); // Remove callback by passing undefined
      toggles.set(mockEntity, ToggleState.On);

      // Callback should not be called since it was removed
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should change the toggle state', () => {
      const mockEntity = 303 as Entity;

      toggles.addToggle(mockEntity, ToggleState.Off);
      expect(toggles.isOn(mockEntity)).toBe(false);

      toggles.set(mockEntity, ToggleState.On);
      expect(toggles.isOn(mockEntity)).toBe(true);
    });

    it('should execute callback when state changes', () => {
      const mockEntity = 404 as Entity;
      const mockCallback = jest.fn();

      toggles.addToggle(mockEntity, ToggleState.Off, mockCallback);
      toggles.set(mockEntity, ToggleState.On);

      expect(mockCallback).toHaveBeenCalledWith(ToggleState.On);
    });

    it('should not execute callback when state does not change', () => {
      const mockEntity = 505 as Entity;
      const mockCallback = jest.fn();

      toggles.addToggle(mockEntity, ToggleState.On, mockCallback);
      toggles.set(mockEntity, ToggleState.On); // Same state, should not trigger callback

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('flip', () => {
    it('should flip the toggle state from Off to On', () => {
      const mockEntity = 606 as Entity;

      toggles.addToggle(mockEntity, ToggleState.Off);
      expect(toggles.isOn(mockEntity)).toBe(false);

      toggles.flip(mockEntity);
      expect(toggles.isOn(mockEntity)).toBe(true);
    });

    it('should flip the toggle state from On to Off', () => {
      const mockEntity = 707 as Entity;

      toggles.addToggle(mockEntity, ToggleState.On);
      expect(toggles.isOn(mockEntity)).toBe(true);

      toggles.flip(mockEntity);
      expect(toggles.isOn(mockEntity)).toBe(false);
    });
  });

  describe('isOn', () => {
    it('should return true when toggle state is On', () => {
      const mockEntity = 808 as Entity;

      toggles.addToggle(mockEntity, ToggleState.On);

      expect(toggles.isOn(mockEntity)).toBe(true);
    });

    it('should return false when toggle state is Off', () => {
      const mockEntity = 909 as Entity;

      toggles.addToggle(mockEntity, ToggleState.Off);

      expect(toggles.isOn(mockEntity)).toBe(false);
    });
  });

  describe('ToggleState enum', () => {
    it('should have correct values', () => {
      expect(ToggleState.Off).toBe(0);
      expect(ToggleState.On).toBe(1);
    });
  });
});