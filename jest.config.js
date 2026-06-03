const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!@dcl/)"
  ],
  moduleNameMapper: {
    "^@dcl/sdk/ecs$": "<rootDir>/__mocks__/@dcl/sdk/ecs.js",
    "^@dcl/sdk/math$": "<rootDir>/__mocks__/@dcl/sdk/math.js"
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!**/node_modules/**"
  ]
};