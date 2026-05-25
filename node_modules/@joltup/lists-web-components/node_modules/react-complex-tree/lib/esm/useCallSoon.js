import { useCallback, useEffect, useRef } from 'react';
/**
 * React hook that schedules a callback to be run "soon" and will cancel the
 * callback if it is still pending when the component is unmounted.
 *
 * @returns A function that can be used to schedule a deferred callback.
 */
export function useCallSoon(dontClean) {
    if (dontClean === void 0) { dontClean = false; }
    var handleRef = useRef(new Array());
    useEffect(function () {
        if (dontClean) {
            return function () { };
        }
        var handles = handleRef.current;
        return function () { return handles.forEach(function (handle) { return cancelAnimationFrame(handle); }); };
    }, [dontClean, handleRef]);
    return useCallback(function (callback) {
        var handle = requestAnimationFrame(function () {
            handleRef.current.splice(handleRef.current.indexOf(handle), 1);
            callback();
        });
        handleRef.current.push(handle);
    }, [handleRef]);
}
