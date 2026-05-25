"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitFor = void 0;
var waitFor = function (check, intervalMs, timeoutMs) {
    if (intervalMs === void 0) { intervalMs = 50; }
    if (timeoutMs === void 0) { timeoutMs = 10000; }
    return new Promise(function (resolve) {
        if (check()) {
            resolve();
        }
        var complete;
        var interval = setInterval(function () {
            if (check()) {
                complete();
            }
        }, intervalMs);
        var timeout = setTimeout(function () {
            complete();
        }, timeoutMs);
        complete = function () {
            clearInterval(interval);
            clearTimeout(timeout);
            resolve();
        };
    });
};
exports.waitFor = waitFor;
