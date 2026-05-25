"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRefCopy = void 0;
var react_1 = require("react");
var useRefCopy = function (value) {
    var ref = (0, react_1.useRef)(value);
    ref.current = value;
    return ref;
};
exports.useRefCopy = useRefCopy;
