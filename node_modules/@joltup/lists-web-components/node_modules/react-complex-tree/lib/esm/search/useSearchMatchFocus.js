import { useTree } from '../tree/Tree';
import { useTreeEnvironment } from '../controlledEnvironment/ControlledTreeEnvironment';
import { defaultMatcher } from './defaultMatcher';
import { useSideEffect } from '../useSideEffect';
import { useLinearItems } from '../controlledEnvironment/useLinearItems';
import { useCallSoon } from '../useCallSoon';
export var useSearchMatchFocus = function () {
    var _a = useTreeEnvironment(), doesSearchMatchItem = _a.doesSearchMatchItem, items = _a.items, getItemTitle = _a.getItemTitle, onFocusItem = _a.onFocusItem;
    var _b = useTree(), search = _b.search, treeId = _b.treeId;
    var linearItems = useLinearItems(treeId);
    var callSoon = useCallSoon();
    useSideEffect(function () {
        if (search && search.length > 0) {
            callSoon(function () {
                var focusItem = linearItems.find(function (_a) {
                    var item = _a.item;
                    return (doesSearchMatchItem !== null && doesSearchMatchItem !== void 0 ? doesSearchMatchItem : defaultMatcher)(search, items[item], getItemTitle(items[item]));
                });
                if (focusItem) {
                    onFocusItem === null || onFocusItem === void 0 ? void 0 : onFocusItem(items[focusItem.item], treeId);
                }
            });
        }
    }, [
        doesSearchMatchItem,
        getItemTitle,
        linearItems,
        items,
        onFocusItem,
        search,
        treeId,
        callSoon,
    ], [search]);
};
