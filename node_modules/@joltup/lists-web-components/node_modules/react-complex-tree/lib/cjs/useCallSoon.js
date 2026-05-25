"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCallSoon = void 0;
var react_1 = require("react");
/**
 * React hook that schedules a callback to be run "soon" and will cancel the
 * callback if it is still pending when the component is unmounted.
 *
 * @returns A function that can be used to schedule a deferred callback.
 */
function useCallSoon(dontClean) {
    if (dontClean === void 0) { dontClean = false; }
    var handleRef = (0, react_1.useRef)(new Array());
    (0, react_1.useEffect)(function () {
        if (dontClean) {
            return function () { };
        }
        var handles = handleRef.current;
        return function () { return handles.forEach(function (handle) { return cancelAnimationFrame(handle); }); };
    }, [dontClean, handleRef]);
    return (0, react_1.useCallback)(function (callback) {
        var handle = requestAnimationFrame(function () {
            handleRef.current.splice(handleRef.current.indexOf(handle), 1);
            callback();
        });
        handleRef.current.push(handle);
    }, [handleRef]);
}
exports.useCallSoon = useCallSoon;
