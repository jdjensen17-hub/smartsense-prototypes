"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMoveFocusToIndex = void 0;
var useViewState_1 = require("./useViewState");
var Tree_1 = require("./Tree");
var ControlledTreeEnvironment_1 = require("../controlledEnvironment/ControlledTreeEnvironment");
var useLinearItems_1 = require("../controlledEnvironment/useLinearItems");
var useStableHandler_1 = require("../useStableHandler");
var useMoveFocusToIndex = function () {
    var treeId = (0, Tree_1.useTree)().treeId;
    var _a = (0, ControlledTreeEnvironment_1.useTreeEnvironment)(), onFocusItem = _a.onFocusItem, items = _a.items;
    var linearItems = (0, useLinearItems_1.useLinearItems)(treeId);
    var viewState = (0, useViewState_1.useViewState)();
    return (0, useStableHandler_1.useStableHandler)(function (computeNewIndex) {
        var _a;
        var currentIndex = (_a = linearItems.findIndex(function (item) { return item.item === viewState.focusedItem; })) !== null && _a !== void 0 ? _a : 0;
        var newIndex = computeNewIndex(currentIndex, linearItems);
        var newIndexBounded = Math.max(0, Math.min(linearItems.length - 1, newIndex));
        var newFocusItem = items[linearItems[newIndexBounded].item];
        onFocusItem === null || onFocusItem === void 0 ? void 0 : onFocusItem(newFocusItem, treeId);
        return newFocusItem;
    });
};
exports.useMoveFocusToIndex = useMoveFocusToIndex;
