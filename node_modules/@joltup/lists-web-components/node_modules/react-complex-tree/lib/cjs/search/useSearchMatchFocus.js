"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSearchMatchFocus = void 0;
var Tree_1 = require("../tree/Tree");
var ControlledTreeEnvironment_1 = require("../controlledEnvironment/ControlledTreeEnvironment");
var defaultMatcher_1 = require("./defaultMatcher");
var useSideEffect_1 = require("../useSideEffect");
var useLinearItems_1 = require("../controlledEnvironment/useLinearItems");
var useCallSoon_1 = require("../useCallSoon");
var useSearchMatchFocus = function () {
    var _a = (0, ControlledTreeEnvironment_1.useTreeEnvironment)(), doesSearchMatchItem = _a.doesSearchMatchItem, items = _a.items, getItemTitle = _a.getItemTitle, onFocusItem = _a.onFocusItem;
    var _b = (0, Tree_1.useTree)(), search = _b.search, treeId = _b.treeId;
    var linearItems = (0, useLinearItems_1.useLinearItems)(treeId);
    var callSoon = (0, useCallSoon_1.useCallSoon)();
    (0, useSideEffect_1.useSideEffect)(function () {
        if (search && search.length > 0) {
            callSoon(function () {
                var focusItem = linearItems.find(function (_a) {
                    var item = _a.item;
                    return (doesSearchMatchItem !== null && doesSearchMatchItem !== void 0 ? doesSearchMatchItem : defaultMatcher_1.defaultMatcher)(search, items[item], getItemTitle(items[item]));
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
exports.useSearchMatchFocus = useSearchMatchFocus;
