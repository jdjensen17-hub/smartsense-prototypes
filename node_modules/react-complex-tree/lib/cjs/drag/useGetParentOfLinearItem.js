"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGetGetParentOfLinearItem = void 0;
var react_1 = require("react");
var ControlledTreeEnvironment_1 = require("../controlledEnvironment/ControlledTreeEnvironment");
var useGetGetParentOfLinearItem = function () {
    var environment = (0, ControlledTreeEnvironment_1.useTreeEnvironment)();
    return (0, react_1.useCallback)(function (itemLinearIndex, treeId) {
        var linearItems = environment.linearItems[treeId];
        var depth = linearItems[itemLinearIndex].depth;
        var parentLinearIndex = itemLinearIndex;
        for (; !!linearItems[parentLinearIndex] &&
            linearItems[parentLinearIndex].depth !== depth - 1; parentLinearIndex -= 1)
            ;
        var parent = linearItems[parentLinearIndex];
        if (!parent) {
            parent = { item: environment.trees[treeId].rootItem, depth: 0 };
            parentLinearIndex = 0;
        }
        return { parent: parent, parentLinearIndex: parentLinearIndex };
    }, [environment.linearItems, environment.trees]);
};
exports.useGetGetParentOfLinearItem = useGetGetParentOfLinearItem;
