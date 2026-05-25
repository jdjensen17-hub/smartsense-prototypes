"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useViewState = void 0;
var Tree_1 = require("./Tree");
var ControlledTreeEnvironment_1 = require("../controlledEnvironment/ControlledTreeEnvironment");
var useViewState = function () {
    var _a;
    var treeId = (0, Tree_1.useTree)().treeId;
    var viewState = (0, ControlledTreeEnvironment_1.useTreeEnvironment)().viewState;
    return (_a = viewState[treeId]) !== null && _a !== void 0 ? _a : {};
};
exports.useViewState = useViewState;
