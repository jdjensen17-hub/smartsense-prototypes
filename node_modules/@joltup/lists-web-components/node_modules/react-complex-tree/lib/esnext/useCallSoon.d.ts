/**
 * React hook that schedules a callback to be run "soon" and will cancel the
 * callback if it is still pending when the component is unmounted.
 *
 * @returns A function that can be used to schedule a deferred callback.
 */
export declare function useCallSoon(dontClean?: boolean): (callback: () => void) => void;
