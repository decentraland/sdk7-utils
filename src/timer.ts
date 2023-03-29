import { engine, Entity, IEngine, TransformType, Schemas, Transform } from '@dcl/sdk/ecs'
import { priority } from './priority'

export type Timers = ReturnType<typeof createTimers>

export type Callback = () => void

export type TimerId = number

function createTimers(targetEngine: IEngine) {
  type TimerData = {
    accumulatedTime: number,
    interval: number,
    recurrent: boolean,
    callback: Callback
  }

  const timers: Map<TimerId, TimerData> = new Map()
  let timerIdCounter = 0

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

  targetEngine.addSystem(system, priority.TimerSystemPriority)

  return {
    setTimeout(callback: Callback, milliseconds: number): TimerId {
      let timerId = timerIdCounter++
      timers.set(timerId, {callback: callback, interval: milliseconds, recurrent: false, accumulatedTime: 0})
      return timerId
    },
    clearTimeout(timer: TimerId) {
      timers.delete(timer)
    },
    setInterval(callback: Callback, milliseconds: number): TimerId {
      let timerId = timerIdCounter++
      timers.set(timerId, {callback: callback, interval: milliseconds, recurrent: true, accumulatedTime: 0})
      return timerId
    },
    clearInterval(timer: TimerId) {
      timers.delete(timer)
    }
  }
}

export const timers = createTimers(engine)
