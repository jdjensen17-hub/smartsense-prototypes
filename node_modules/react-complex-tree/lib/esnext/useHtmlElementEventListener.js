import { useEffect } from 'react';
import { useStableHandler } from './useStableHandler';
export var useHtmlElementEventListener = function (element, type, listener) {
    var stableListener = useStableHandler(listener);
    useEffect(function () {
        if (element) {
            element.addEventListener(type, stableListener);
            return function () { return element.removeEventListener(type, stableListener); };
        }
        return function () { };
    }, [element, stableListener, type]);
};
