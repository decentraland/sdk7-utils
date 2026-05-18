// Mock @dcl/sdk/ecs
const mockComponents = new Map();

// Mock entity counter
let entityIdCounter = 0;

module.exports = {
  Entity: String,
  engine: {
    getEntitiesWith: jest.fn(() => []),
    addSystem: jest.fn(),
    RootEntity: 'root-entity',
    PlayerEntity: 'player-entity',
    defineComponent: jest.fn((name, schema) => {
      const component = {
        name,
        schema,
        entities: new Map(),
        create: jest.fn((entity, data) => {
          component.entities.set(entity, data);
        }),
        createOrReplace: jest.fn((entity, data) => {
          component.entities.set(entity, data);
        }),
        get: jest.fn((entity) => component.entities.get(entity)),
        has: jest.fn((entity) => component.entities.has(entity)),
        deleteFrom: jest.fn((entity) => component.entities.delete(entity)),
      };
      mockComponents.set(name, component);
      return component;
    }),
  },
  addEntity: jest.fn(() => entityIdCounter++),
  Transform: {
    get: jest.fn(),
    getMutable: jest.fn(),
    create: jest.fn(),
    createOrReplace: jest.fn(),
    has: jest.fn(),
    deleteFrom: jest.fn(),
  },
  Tween: {
    create: jest.fn(),
    createOrReplace: jest.fn(),
    has: jest.fn(),
    deleteFrom: jest.fn(),
    get: jest.fn(),
    Mode: {
      Rotate: jest.fn((rotateData) => ({ type: 'rotate', ...rotateData }))
    }
  },
  TweenSequence: {
    create: jest.fn(),
    createOrReplace: jest.fn(),
    has: jest.fn(),
    deleteFrom: jest.fn(),
    get: jest.fn(),
  },
  TweenLoop: {
    TL_RESTART: 'restart'
  },
  Schemas: {
    Quaternion: 'quaternion'
  },
  EasingFunction: {
    EF_LINEAR: 'linear',
    EF_EASEINQUAD: 'easeInQuad',
    EF_EASEOUTQUAD: 'easeOutQuad',
    EF_EASEQUAD: 'easeQuad',
    EF_EASEINSINE: 'easeInSine',
    EF_EASEOUTSINE: 'easeOutSine',
    EF_EASESINE: 'easeSine',
    EF_EASEINEXPO: 'easeInExpo',
    EF_EASEOUTEXPO: 'easeOutExpo',
    EF_EASEEXPO: 'easeExpo',
    EF_EASEINELASTIC: 'easeInElastic',
    EF_EASEOUTELASTIC: 'easeOutElastic',
    EF_EASEELASTIC: 'easeElastic',
    EF_EASEINBOUNCE: 'easeInBounce',
    EF_EASEOUTBOUNCE: 'easeOutBounce',
    EF_EASEBOUNCE: 'easeBounce',
  },
  IEngine: jest.fn()
};