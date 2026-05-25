type AbstractEventMap = {
    [eventName: string]: any;
};
type Listener<M extends AbstractEventMap, K extends string> = (event: M[K]) => any;
export declare class EventListenerManager<M extends AbstractEventMap> {
    private handlers;
    addEventListener<K extends keyof M & string>(type: K, listener: Listener<M, K>): void;
    removeEventListener<K extends keyof M & string>(type: K, listener: Listener<M, K>): void;
    emitEvent<K extends keyof M & string>(type: K, payload: M[K]): void;
}
export {};
