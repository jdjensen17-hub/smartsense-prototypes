"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultMatcher = void 0;
var defaultMatcher = function (search, item, itemTitle) {
    return itemTitle.toLowerCase().includes(search.toLowerCase());
};
exports.defaultMatcher = defaultMatcher;
