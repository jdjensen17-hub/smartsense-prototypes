"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSideEffect = void 0;
var react_1 = require("react");
var useSideEffect = function (effect, deps, changeOn) {
    var previousRef = (0, react_1.useRef)();
    (0, react_1.useEffect)(function () {
        if (!previousRef.current) {
            previousRef.current = __spreadArray([], changeOn, true);
            effect();
        }
        else {
            var changed = previousRef.current.some(function (v, i) { return v !== changeOn[i]; });
            if (changed) {
                previousRef.current = __spreadArray([], changeOn, true);
                effect();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, __spreadArray(__spreadArray([], deps, true), changeOn, true));
};
exports.useSideEffect = useSideEffect;
