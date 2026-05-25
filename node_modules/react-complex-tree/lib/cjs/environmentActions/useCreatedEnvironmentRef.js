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
exports.useCreatedEnvironmentRef = void 0;
var react_1 = require("react");
var ControlledTreeEnvironment_1 = require("../controlledEnvironment/ControlledTreeEnvironment");
var DragAndDropProvider_1 = require("../drag/DragAndDropProvider");
var useCreatedEnvironmentRef = function (ref, actions) {
    var environment = (0, ControlledTreeEnvironment_1.useTreeEnvironment)();
    var dnd = (0, DragAndDropProvider_1.useDragAndDrop)();
    (0, react_1.useImperativeHandle)(ref, function () { return (__assign(__assign(__assign({}, actions), environment), { treeEnvironmentContext: environment, dragAndDropContext: dnd })); });
};
exports.useCreatedEnvironmentRef = useCreatedEnvironmentRef;
