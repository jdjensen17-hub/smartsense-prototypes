"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFocusWithin = void 0;
var react_1 = require("react");
var useHtmlElementEventListener_1 = require("../useHtmlElementEventListener");
var useCallSoon_1 = require("../useCallSoon");
var useFocusWithin = function (element, onFocusIn, onFocusOut) {
    var _a = (0, react_1.useState)(false), focusWithin = _a[0], setFocusWithin = _a[1];
    var isLoosingFocusFlag = (0, react_1.useRef)(false);
    var callSoon = (0, useCallSoon_1.useCallSoon)();
    (0, useHtmlElementEventListener_1.useHtmlElementEventListener)(element, 'focusin', function () {
        if (!focusWithin) {
            setFocusWithin(true);
            onFocusIn === null || onFocusIn === void 0 ? void 0 : onFocusIn();
        }
        if (isLoosingFocusFlag.current) {
            isLoosingFocusFlag.current = false;
        }
    });
    (0, useHtmlElementEventListener_1.useHtmlElementEventListener)(element, 'focusout', function () {
        isLoosingFocusFlag.current = true;
        callSoon(function () {
            if (isLoosingFocusFlag.current &&
                !(element === null || element === void 0 ? void 0 : element.contains(document.activeElement))) {
                onFocusOut === null || onFocusOut === void 0 ? void 0 : onFocusOut();
                isLoosingFocusFlag.current = false;
                setFocusWithin(false);
            }
        });
    });
    return focusWithin;
};
exports.useFocusWithin = useFocusWithin;
