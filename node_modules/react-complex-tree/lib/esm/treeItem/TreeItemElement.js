import React, { useMemo, useState } from 'react';
import { TreeItemChildren } from './TreeItemChildren';
import { useViewState } from '../tree/useViewState';
import { useTree } from '../tree/Tree';
import { useTreeEnvironment } from '../controlledEnvironment/ControlledTreeEnvironment';
import { useTreeItemRenderContext } from './useTreeItemRenderContext';
import { TreeItemRenamingInput } from './TreeItemRenamingInput';
export var TreeItemElement = function (props) {
    var _a, _b, _c, _d;
    var _e = useState(false), hasBeenRequested = _e[0], setHasBeenRequested = _e[1];
    var _f = useTree(), renderers = _f.renderers, treeInformation = _f.treeInformation, renamingItem = _f.renamingItem;
    var environment = useTreeEnvironment();
    var viewState = useViewState();
    var item = environment.items[props.itemIndex];
    var isExpanded = useMemo(function () { var _a; return (_a = viewState.expandedItems) === null || _a === void 0 ? void 0 : _a.includes(props.itemIndex); }, [props.itemIndex, viewState.expandedItems]);
    var renderContext = useTreeItemRenderContext(item);
    if (item === undefined || renderContext === undefined) {
        if (!hasBeenRequested) {
            setHasBeenRequested(true);
            (_a = environment.onMissingItems) === null || _a === void 0 ? void 0 : _a.call(environment, [props.itemIndex]);
        }
        return null;
    }
    var shouldRenderChildren = (_c = (_b = environment.shouldRenderChildren) === null || _b === void 0 ? void 0 : _b.call(environment, item, renderContext)) !== null && _c !== void 0 ? _c : (item.isFolder && isExpanded);
    var children = item.children && shouldRenderChildren && (React.createElement(TreeItemChildren, { depth: props.depth + 1, parentId: props.itemIndex }, item.children));
    var title = environment.getItemTitle(item);
    var titleComponent = renamingItem === props.itemIndex ? (React.createElement(TreeItemRenamingInput, { itemIndex: props.itemIndex })) : (renderers.renderItemTitle({
        info: treeInformation,
        context: renderContext,
        title: title,
        item: item,
    }));
    var arrowComponent = renderers.renderItemArrow({
        info: treeInformation,
        context: renderContext,
        item: environment.items[props.itemIndex],
    });
    return ((_d = renderers.renderItem({
        item: environment.items[props.itemIndex],
        depth: props.depth,
        title: titleComponent,
        arrow: arrowComponent,
        context: renderContext,
        info: treeInformation,
        children: children,
    })) !== null && _d !== void 0 ? _d : null); // Type to use AllTreeRenderProps
};
