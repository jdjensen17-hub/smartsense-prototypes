import { useCallback } from 'react';
import { useRefCopy } from './useRefCopy';
export var useStableHandler = function (handler) {
    var handlerRef = useRefCopy(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useCallback((function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return handlerRef.current.apply(handlerRef, args);
    }), [
        handlerRef,
    ]);
};
