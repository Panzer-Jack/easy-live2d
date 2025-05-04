import { Live2DSpriteEvents } from "src/types/events"

export class EventManager {
    events: Map<keyof Live2DSpriteEvents, Function> = new Map()
    isActive = false

    constructor() { }

    public on<K extends keyof Live2DSpriteEvents>(
        eventName: K,
        event: (...args: Live2DSpriteEvents[K]) => void
    ): void {
        this.events.set(eventName, event)
    }

    off(name: keyof Live2DSpriteEvents): void {
        this.events.delete(name)
    }

    public emit<K extends keyof Live2DSpriteEvents>(
        eventName: K,
        ...args: Live2DSpriteEvents[K]
    ): void {
        this.events.get(eventName)?.(
            ...args,
        )
    }

    public active() {
        // 全局监听事件
        if (!this.isActive) {
            this.isActive = true
            this.events.forEach((event) => {
                event()
            })
        }
    }

    public clear() {
        this.events.clear()
    }
}

export const eventManager = new EventManager()

