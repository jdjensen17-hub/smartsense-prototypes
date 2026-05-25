"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLinearItems = void 0;
var ControlledTreeEnvironment_1 = require("./ControlledTreeEnvironment");
var useLinearItems = function (treeId) {
    return (0, ControlledTreeEnvironment_1.useTreeEnvironment)().linearItems[treeId];
};
exports.useLinearItems = useLinearItems;
