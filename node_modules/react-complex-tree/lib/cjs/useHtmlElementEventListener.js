"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHtmlElementEventListener = void 0;
var react_1 = require("react");
var useStableHandler_1 = require("./useStableHandler");
var useHtmlElementEventListener = function (element, type, listener) {
    var stableListener = (0, useStableHandler_1.useStableHandler)(listener);
    (0, react_1.useEffect)(function () {
        if (element) {
            element.addEventListener(type, stableListener);
            return function () { return element.removeEventListener(type, stableListener); };
        }
        return function () { };
    }, [element, stableListener, type]);
};
exports.useHtmlElementEventListener = useHtmlElementEventListener;
