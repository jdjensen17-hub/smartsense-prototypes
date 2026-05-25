"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useKeyboardBindings = void 0;
var react_1 = require("react");
var ControlledTreeEnvironment_1 = require("../controlledEnvironment/ControlledTreeEnvironment");
var defaultKeyboardBindings_1 = require("./defaultKeyboardBindings");
var useKeyboardBindings = function () {
    var environment = (0, ControlledTreeEnvironment_1.useTreeEnvironment)();
    return (0, react_1.useMemo)(function () {
        if (environment.keyboardBindings) {
            return __assign(__assign({}, defaultKeyboardBindings_1.defaultKeyboardBindings), environment.keyboardBindings);
        }
        return defaultKeyboardBindings_1.defaultKeyboardBindings;
    }, [environment.keyboardBindings]);
};
exports.useKeyboardBindings = useKeyboardBindings;
