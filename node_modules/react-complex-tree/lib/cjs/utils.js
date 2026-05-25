"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocument = exports.buildMapForTrees = void 0;
var buildMapForTrees = function (treeIds, build) {
    return treeIds
        .map(function (id) { return [id, build(id)]; })
        .reduce(function (a, _a) {
        var _b;
        var id = _a[0], obj = _a[1];
        return (__assign(__assign({}, a), (_b = {}, _b[id] = obj, _b)));
    }, {});
};
exports.buildMapForTrees = buildMapForTrees;
var getDocument = function () {
    return typeof document !== 'undefined' ? document : undefined;
};
exports.getDocument = getDocument;
