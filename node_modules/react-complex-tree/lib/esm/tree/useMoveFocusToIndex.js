import { useViewState } from './useViewState';
import { useTree } from './Tree';
import { useTreeEnvironment } from '../controlledEnvironment/ControlledTreeEnvironment';
import { useLinearItems } from '../controlledEnvironment/useLinearItems';
import { useStableHandler } from '../useStableHandler';
export var useMoveFocusToIndex = function () {
    var treeId = useTree().treeId;
    var _a = useTreeEnvironment(), onFocusItem = _a.onFocusItem, items = _a.items;
    var linearItems = useLinearItems(treeId);
    var viewState = useViewState();
    return useStableHandler(function (computeNewIndex) {
        var _a;
        var currentIndex = (_a = linearItems.findIndex(function (item) { return item.item === viewState.focusedItem; })) !== null && _a !== void 0 ? _a : 0;
        var newIndex = computeNewIndex(currentIndex, linearItems);
        var newIndexBounded = Math.max(0, Math.min(linearItems.length - 1, newIndex));
        var newFocusItem = items[linearItems[newIndexBounded].item];
        onFocusItem === null || onFocusItem === void 0 ? void 0 : onFocusItem(newFocusItem, treeId);
        return newFocusItem;
    });
};
