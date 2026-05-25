"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useKey = void 0;
var useHtmlElementEventListener_1 = require("../useHtmlElementEventListener");
var utils_1 = require("../utils");
var useKey = function (key, onHit, active) {
    (0, useHtmlElementEventListener_1.useHtmlElementEventListener)((0, utils_1.getDocument)(), 'keydown', function (e) {
        if (!active) {
            return;
        }
        if (active && key.toLowerCase() === e.key.toLowerCase()) {
            onHit(e);
        }
    });
};
exports.useKey = useKey;
