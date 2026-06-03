/// <reference types="jest" />

import { Entity, PBAudioSource } from "@dcl/sdk/ecs";
import { sounds } from "./audio";

jest.mock("@dcl/sdk/ecs", () => {
  const mockCreateOrReplace = jest.fn();
  const mockStopSound = jest.fn();
  const mockHas = jest.fn();

  return {
    ...jest.requireActual("@dcl/sdk/ecs"),
    AudioSource: {
      createOrReplace: mockCreateOrReplace,
      stopSound: mockStopSound,
      has: mockHas,
    },
    EntityState: {
      Removed: 3,
      Unset: 0,
    },
    engine: {
      addSystem: jest.fn(),
      getEntityState: jest.fn(),
    },
  };
});

describe("Audio Module", () => {
  let mockEntity: Entity;
  let mockAudioSource: PBAudioSource;

  beforeEach(() => {
    mockEntity = 1 as Entity;
    mockAudioSource = {
      playing: false,
      loop: false,
      volume: 1.0,
      pitch: 1.0,
      audioClipUrl: "test-audio.mp3",
    };

    // Reset all mocks
    jest.clearAllMocks();

    // Set default return values for mocks using jest.requireMock
    const mockedEcs = jest.requireMock("@dcl/sdk/ecs");
    mockedEcs.AudioSource.has.mockReturnValue(true);
  });

  describe("sounds module", () => {
    it("should be defined", () => {
      expect(sounds).toBeDefined();
    });

    it("should have playSoundSegment function", () => {
      expect(sounds.playSoundSegment).toBeDefined();
      expect(typeof sounds.playSoundSegment).toBe("function");
    });
  });

  describe("playSoundSegment", () => {
    it("should play a sound segment with correct parameters", () => {
      const mockedEcs = jest.requireMock("@dcl/sdk/ecs");
      const start = 0;
      const end = 5;

      mockedEcs.AudioSource.createOrReplace.mockImplementation(() => {});

      sounds.playSoundSegment(mockEntity, mockAudioSource as PBAudioSource, start, end);

      expect(mockedEcs.AudioSource.createOrReplace).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          ...mockAudioSource,
          playing: true,
          currentTime: start,
        })
      );
    });

    it("should throw an error if start is negative", () => {
      expect(() => {
        sounds.playSoundSegment(mockEntity, mockAudioSource as PBAudioSource, -1, 5);
      }).toThrow('Invalid "start" parameter provided. "start" parameter should be >= 0.');
    });

    it("should throw an error if start is greater than or equal to end", () => {
      expect(() => {
        sounds.playSoundSegment(mockEntity, mockAudioSource as PBAudioSource, 5, 5);
      }).toThrow('Invalid "start" & "end" parameters provided. "start" parameter should be lower than "end" parameter.');

      expect(() => {
        sounds.playSoundSegment(mockEntity, mockAudioSource as PBAudioSource, 6, 5);
      }).toThrow('Invalid "start" & "end" parameters provided. "start" parameter should be lower than "end" parameter.');
    });

    it("should allow valid start and end values", () => {
      const mockedEcs = jest.requireMock("@dcl/sdk/ecs");
      const start = 1;
      const end = 5;

      expect(() => {
        sounds.playSoundSegment(mockEntity, mockAudioSource as PBAudioSource, start, end);
      }).not.toThrow();

      // Verify the sound was created with the correct parameters
      expect(mockedEcs.AudioSource.createOrReplace).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          ...mockAudioSource,
          playing: true,
          currentTime: start,
        })
      );
    });
  });

  describe("assertSound function validation", () => {
    it("should validate that start is less than end", () => {
      expect(() => {
        sounds.playSoundSegment(mockEntity, mockAudioSource as PBAudioSource, 2, 1);
      }).toThrow('Invalid "start" & "end" parameters provided. "start" parameter should be lower than "end" parameter.');
    });

    it("should validate that start is not negative", () => {
      expect(() => {
        sounds.playSoundSegment(mockEntity, mockAudioSource as PBAudioSource, -1, 5);
      }).toThrow('Invalid "start" parameter provided. "start" parameter should be >= 0.');
    });

    it("should accept valid range where start equals 0", () => {
      expect(() => {
        sounds.playSoundSegment(mockEntity, mockAudioSource as PBAudioSource, 0, 10);
      }).not.toThrow();
    });
  });
});