"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getItemsLinearly = void 0;
var getItemsLinearly = function (rootItem, viewState, items, depth) {
    var _a, _b, _c;
    if (depth === void 0) { depth = 0; }
    var itemIds = [];
    for (var _i = 0, _d = (_b = (_a = items[rootItem]) === null || _a === void 0 ? void 0 : _a.children) !== null && _b !== void 0 ? _b : []; _i < _d.length; _i++) {
        var itemId = _d[_i];
        var item = items[itemId];
        itemIds.push({ item: itemId, depth: depth });
        if (item &&
            item.isFolder &&
            !!item.children &&
            ((_c = viewState.expandedItems) === null || _c === void 0 ? void 0 : _c.includes(itemId))) {
            itemIds.push.apply(itemIds, (0, exports.getItemsLinearly)(itemId, viewState, items, depth + 1));
        }
    }
    return itemIds;
};
exports.getItemsLinearly = getItemsLinearly;
