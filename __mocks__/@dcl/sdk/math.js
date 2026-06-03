// Mock @dcl/sdk/math
module.exports = {
  Vector3: {
    create: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
    Zero: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
    add: jest.fn(),
    rotate: jest.fn(),
    distanceSquared: jest.fn(),
    catmullRom: jest.fn(),
    clone: jest.fn(vec => ({ ...vec })),
  },
  Quaternion: {
    Identity: jest.fn(() => ({ x: 0, y: 0, z: 0, w: 1 })),
    multiply: jest.fn((a, b) => ({ x: 0, y: 0, z: 0, w: 1 })),
    normalize: jest.fn((q) => q),
    slerp: jest.fn((start, end, t) => ({ x: 0, y: 0, z: 0, w: 1 })),
    fromEulerDegrees: jest.fn((x, y, z) => ({ x, y, z, w: 1 })),
    equals: jest.fn((a, b) => a.x === b.x && a.y === b.y && a.z === b.z && a.w === b.w)
  }
};