import { Entity, IEngine, TransformType, Schemas } from '@dcl/sdk/ecs'
import { priority } from './priority'
import { getSDK } from './sdk'

export type Timers = ReturnType<typeof initTimers>

export type Callback = () => void

export type TimerId = number

type TimerData = {
  accumulatedTime: number,
  interval: number,
  recurrent: boolean,
  callback: Callback
}

const timers: Map<TimerId, TimerData> = new Map()

let timerIdCounter = 0
let timersSystemStarted = false

function initTimers() {

  if (timersSystemStarted) return
  timersSystemStarted = true

  const { engine } = getSDK()

  function system(dt: number) {
    let deadTimers = []
    let callbacks = []

    for (let [timerId, timerData] of timers) {
      timerData.accumulatedTime += 1000 * dt
      if (timerData.accumulatedTime < timerData.interval)
        continue

      callbacks.push(timerData.callback)

      if (timerData.recurrent) {
        timerData.accumulatedTime -= Math.floor(timerData.accumulatedTime / timerData.interval) * timerData.interval
      } else {
        deadTimers.push(timerId)
      }
    }

    for (let timerId of deadTimers)
      timers.delete(timerId)

    for (let callback of callbacks)
      callback()
  }

  engine.addSystem(system, priority.TimerSystemPriority)

}
export function setTimeout(callback: Callback, milliseconds: number): TimerId {
  initTimers()
  let timerId = timerIdCounter++
  timers.set(timerId, { callback: callback, interval: milliseconds, recurrent: false, accumulatedTime: 0 })
  return timerId
}

export function clearTimeout(timer: TimerId) {
  timers.delete(timer)
}

export function setInterval(callback: Callback, milliseconds: number): TimerId {
  initTimers()
  let timerId = timerIdCounter++
  timers.set(timerId, { callback: callback, interval: milliseconds, recurrent: true, accumulatedTime: 0 })
  return timerId
}

export function clearInterval(timer: TimerId) {
  timers.delete(timer)
}