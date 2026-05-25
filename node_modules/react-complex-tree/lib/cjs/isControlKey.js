"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isControlKey = void 0;
var isControlKey = function (e) {
    return e.ctrlKey ||
        (navigator.platform.toUpperCase().indexOf('MAC') >= 0 && e.metaKey);
};
exports.isControlKey = isControlKey;
