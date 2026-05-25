"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGetOriginalItemOrder = void 0;
var ControlledTreeEnvironment_1 = require("./controlledEnvironment/ControlledTreeEnvironment");
var useStableHandler_1 = require("./useStableHandler");
var useGetOriginalItemOrder = function () {
    var env = (0, ControlledTreeEnvironment_1.useTreeEnvironment)();
    return (0, useStableHandler_1.useStableHandler)(function (treeId, items) {
        return items
            .map(function (item) {
            return [
                item,
                env.linearItems[treeId].findIndex(function (linearItem) { return linearItem.item === item.index; }),
            ];
        })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .sort(function (_a, _b) {
            var _ = _a[0], aPos = _a[1];
            var _2 = _b[0], bPos = _b[1];
            return aPos - bPos;
        })
            .map(function (_a) {
            var item = _a[0];
            return item;
        });
    });
};
exports.useGetOriginalItemOrder = useGetOriginalItemOrder;
