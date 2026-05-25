var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useCallback, useRef } from 'react';
import { useViewState } from './useViewState';
import { useTree } from './Tree';
import { useTreeEnvironment } from '../controlledEnvironment/ControlledTreeEnvironment';
import { useLinearItems } from '../controlledEnvironment/useLinearItems';
var usePrevious = function (value) {
    var ref = useRef({
        target: value,
        previous: undefined,
    });
    if (ref.current.target !== value) {
        ref.current.previous = ref.current.target;
        ref.current.target = value;
    }
    return ref.current.previous;
};
export var useSelectUpTo = function (startingAt) {
    var viewState = useViewState();
    var treeId = useTree().treeId;
    var linearItems = useLinearItems(treeId);
    var onSelectItems = useTreeEnvironment().onSelectItems;
    var focusedItemPrevious = usePrevious(viewState.focusedItem);
    return useCallback(function (item, overrideOldSelection) {
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
