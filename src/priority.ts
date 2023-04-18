const REGULAR_PRIORITY = 100e3

export namespace priority {
  export const TimerSystemPriority = REGULAR_PRIORITY + 256
  export const TweenSystemPriority = REGULAR_PRIORITY + 192
  export const PerpetualMotionSystemPriority = REGULAR_PRIORITY + 192
  export const PathSystemPriority = REGULAR_PRIORITY + 192
  export const TriggerSystemPriority = REGULAR_PRIORITY + 128
  export const ActionSystemPriority = REGULAR_PRIORITY + 64
}
