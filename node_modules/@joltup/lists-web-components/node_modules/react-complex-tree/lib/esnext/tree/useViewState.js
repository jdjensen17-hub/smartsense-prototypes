import { useTree } from './Tree';
import { useTreeEnvironment } from '../controlledEnvironment/ControlledTreeEnvironment';
export var useViewState = function () {
    var _a;
    var treeId = useTree().treeId;
    var viewState = useTreeEnvironment().viewState;
    return (_a = viewState[treeId]) !== null && _a !== void 0 ? _a : {};
};
