import { useTreeEnvironment } from './controlledEnvironment/ControlledTreeEnvironment';
import { useStableHandler } from './useStableHandler';
export var useGetOriginalItemOrder = function () {
    var env = useTreeEnvironment();
    return useStableHandler(function (treeId, items) {
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
