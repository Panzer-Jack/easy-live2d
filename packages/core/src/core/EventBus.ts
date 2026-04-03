import type { Live2DSpriteEvents } from './types'

type EventCallback<K extends keyof Live2DSpriteEvents> = (
  ...args: Live2DSpriteEvents[K]
) => void

type AnyEventCallback = {
  [K in keyof Live2DSpriteEvents]: EventCallback<K>
}[keyof Live2DSpriteEvents]

/**
 * 事件总线
 * 使用 Map<string, Set<Function>> 支持同一事件多个监听器
 * 每个 Live2DSprite 实例持有独立的 EventBus
 */
export class EventBus {
  private listeners = new Map<keyof Live2DSpriteEvents, Set<AnyEventCallback>>()

  on<K extends keyof Live2DSpriteEvents>(
    event: K,
    callback: EventCallback<K>,
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback as AnyEventCallback)
  }

  off<K extends keyof Live2DSpriteEvents>(
    event: K,
    callback: EventCallback<K>,
  ): void {
    this.listeners.get(event)?.delete(callback)
  }

  emit<K extends keyof Live2DSpriteEvents>(
    event: K,
    ...args: Live2DSpriteEvents[K]
  ): void {
    this.listeners.get(event)?.forEach((cb) => {
      ;(cb as EventCallback<K>)(...args)
    })
  }

  clear(): void {
    this.listeners.clear()
  }
}
