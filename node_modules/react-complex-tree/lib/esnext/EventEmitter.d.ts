export interface EventEmitterOptions<EventPayload = any> {
    logger?: (log: string, payload?: EventPayload) => void;
}
export type EventHandler<EventPayload> = ((payload: EventPayload) => Promise<void> | void) | null | undefined;
export declare class EventEmitter<EventPayload> {
    private handlerCount;
    private handlers;
    private options?;
    constructor(options?: EventEmitterOptions<EventPayload>);
    get numberOfHandlers(): number;
    emit(payload: EventPayload): Promise<void>;
    on(handler: EventHandler<EventPayload>): number;
    off(handlerId: number): void;
    delete(handlerId: number): void;
}
