"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSelectUpTo = void 0;
var react_1 = require("react");
var useViewState_1 = require("./useViewState");
var Tree_1 = require("./Tree");
var ControlledTreeEnvironment_1 = require("../controlledEnvironment/ControlledTreeEnvironment");
var useLinearItems_1 = require("../controlledEnvironment/useLinearItems");
var usePrevious = function (value) {
    var ref = (0, react_1.useRef)({
        target: value,
        previous: undefined,
    });
    if (ref.current.target !== value) {
        ref.current.previous = ref.current.target;
        ref.current.target = value;
    }
    return ref.current.previous;
};
var useSelectUpTo = function (startingAt) {
    var viewState = (0, useViewState_1.useViewState)();
    var treeId = (0, Tree_1.useTree)().treeId;
    var linearItems = (0, useLinearItems_1.useLinearItems)(treeId);
    var onSelectItems = (0, ControlledTreeEnvironment_1.useTreeEnvironment)().onSelectItems;
    var focusedItemPrevious = usePrevious(viewState.focusedItem);
    return (0, react_1.useCallback)(function (item, overrideOldSelection) {
        var _a, _b;
        if (overrideOldSelection === void 0) { overrideOldSelection = false; }
        var itemIndex = item.index;
        var selectMergedItems = function (oldSelection, newSelection) {
            var merged = __spreadArray(__spreadArray([], (overrideOldSelection ? [] : oldSelection), true), newSelection.filter(function (i) { return overrideOldSelection || !oldSelection.includes(i); }), true);
            onSelectItems === null || onSelectItems === void 0 ? void 0 : onSelectItems(merged, treeId);
        };
        if (viewState &&
            viewState.selectedItems &&
            viewState.selectedItems.length > 0) {
            // Depending on whether focusItem() or selectUpTo() was called first, which item was the last focused item depends
            var lastFocus_1 = viewState.focusedItem === itemIndex
                ? focusedItemPrevious
                : viewState.focusedItem;
            var selectionStart = startingAt === 'last-focus'
                ? linearItems.findIndex(function (linearItem) { return lastFocus_1 === linearItem.item; })
                : linearItems.findIndex(function (linearItem) { var _a; return (_a = viewState.selectedItems) === null || _a === void 0 ? void 0 : _a.includes(linearItem.item); });
            var selectionEnd = linearItems.findIndex(function (linearItem) { return linearItem.item === itemIndex; });
            if (selectionStart < selectionEnd) {
                var selection = linearItems
                    .slice(selectionStart, selectionEnd + 1)
                    .map(function (_a) {
                    var item = _a.item;
                    return item;
                });
                selectMergedItems((_a = viewState.selectedItems) !== null && _a !== void 0 ? _a : [], selection);
            }
            else {
                var selection = linearItems
                    .slice(selectionEnd, selectionStart + 1)
                    .map(function (_a) {
                    var item = _a.item;
                    return item;
                });
                selectMergedItems((_b = viewState.selectedItems) !== null && _b !== void 0 ? _b : [], selection);
            }
        }
        else {
            onSelectItems === null || onSelectItems === void 0 ? void 0 : onSelectItems([itemIndex], treeId);
        }
    }, [
        viewState,
        onSelectItems,
        treeId,
        startingAt,
        linearItems,
        focusedItemPrevious,
    ]);
};
exports.useSelectUpTo = useSelectUpTo;
