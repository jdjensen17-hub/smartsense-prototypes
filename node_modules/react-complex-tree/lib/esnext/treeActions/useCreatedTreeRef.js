var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { useImperativeHandle } from 'react';
import { useTreeEnvironment } from '../controlledEnvironment/ControlledTreeEnvironment';
import { useDragAndDrop } from '../drag/DragAndDropProvider';
import { useTree } from '../tree/Tree';
export var useCreatedTreeRef = function (ref, actions) {
    var environment = useTreeEnvironment();
    var tree = useTree();
    var dnd = useDragAndDrop();
    useImperativeHandle(ref, function () { return (__assign(__assign(__assign({}, actions), { treeEnvironmentContext: environment, dragAndDropContext: dnd, treeContext: tree }), tree.treeInformation)); });
};
