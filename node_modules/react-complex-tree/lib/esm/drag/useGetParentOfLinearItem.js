import { useCallback } from 'react';
import { useTreeEnvironment } from '../controlledEnvironment/ControlledTreeEnvironment';
export var useGetGetParentOfLinearItem = function () {
    var environment = useTreeEnvironment();
    return useCallback(function (itemLinearIndex, treeId) {
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
