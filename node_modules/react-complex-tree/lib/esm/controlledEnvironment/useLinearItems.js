import { useTreeEnvironment } from './ControlledTreeEnvironment';
export var useLinearItems = function (treeId) {
    return useTreeEnvironment().linearItems[treeId];
};
