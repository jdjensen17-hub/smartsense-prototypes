"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrollIntoView = void 0;
var utils_1 = require("../utils");
var scrollIntoView = function (element) {
    var _a, _b, _c, _d;
    if (!element) {
        return;
    }
    if (element.scrollIntoViewIfNeeded) {
        element.scrollIntoViewIfNeeded();
    }
    else {
        var boundingBox = element.getBoundingClientRect();
        var isElementInViewport = boundingBox.top >= 0 &&
            boundingBox.left >= 0 &&
            boundingBox.bottom <=
                (window.innerHeight ||
                    !!((_b = (_a = (0, utils_1.getDocument)()) === null || _a === void 0 ? void 0 : _a.documentElement) === null || _b === void 0 ? void 0 : _b.clientHeight)) &&
            boundingBox.right <=
                (window.innerWidth || !!((_d = (_c = (0, utils_1.getDocument)()) === null || _c === void 0 ? void 0 : _c.documentElement) === null || _d === void 0 ? void 0 : _d.clientWidth));
        if (!isElementInViewport) {
            element.scrollIntoView();
        }
    }
};
exports.scrollIntoView = scrollIntoView;
