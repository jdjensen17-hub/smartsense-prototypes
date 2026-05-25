var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { useMemo } from 'react';
import { useTreeEnvironment } from '../controlledEnvironment/ControlledTreeEnvironment';
import { defaultKeyboardBindings } from './defaultKeyboardBindings';
export var useKeyboardBindings = function () {
    var environment = useTreeEnvironment();
    return useMemo(function () {
        if (environment.keyboardBindings) {
            return __assign(__assign({}, defaultKeyboardBindings), environment.keyboardBindings);
        }
        return defaultKeyboardBindings;
    }, [environment.keyboardBindings]);
};
