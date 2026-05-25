"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStableHandler = void 0;
var react_1 = require("react");
var useRefCopy_1 = require("./useRefCopy");
var useStableHandler = function (handler) {
    var handlerRef = (0, useRefCopy_1.useRefCopy)(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return (0, react_1.useCallback)((function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return handlerRef.current.apply(handlerRef, args);
    }), [
        handlerRef,
    ]);
};
exports.useStableHandler = useStableHandler;
