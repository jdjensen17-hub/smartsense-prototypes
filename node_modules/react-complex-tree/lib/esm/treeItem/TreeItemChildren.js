import React from 'react';
import { TreeItemElement } from './TreeItemElement';
import { useTree } from '../tree/Tree';
export var TreeItemChildren = function (props) {
    var _a = useTree(), renderers = _a.renderers, treeInformation = _a.treeInformation;
    var childElements = [];
    for (var _i = 0, _b = props.children; _i < _b.length; _i++) {
        var child = _b[_i];
        childElements.push(React.createElement(TreeItemElement, { key: child, itemIndex: child, depth: props.depth }));
    }
    if (childElements.length === 0) {
        return null;
    }
    var containerProps = {
        role: props.depth !== 0 ? 'group' : undefined,
    };
    return renderers.renderItemsContainer({
        children: childElements,
        info: treeInformation,
        containerProps: containerProps,
        depth: props.depth,
        parentId: props.parentId,
    });
};
