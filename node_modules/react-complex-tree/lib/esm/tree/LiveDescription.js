import * as React from 'react';
import { useMemo } from 'react';
import { useTreeEnvironment } from '../controlledEnvironment/ControlledTreeEnvironment';
import { defaultLiveDescriptors } from './defaultLiveDescriptors';
import { useTree } from './Tree';
import { useDragAndDrop } from '../drag/DragAndDropProvider';
import { resolveLiveDescriptor } from './resolveLiveDescriptor';
import { useKeyboardBindings } from '../hotkeys/useKeyboardBindings';
var LiveWrapper = function (_a) {
    var children = _a.children, live = _a.live;
    return React.createElement("div", { "aria-live": live, dangerouslySetInnerHTML: { __html: children } });
};
export var LiveDescription = function () {
    var env = useTreeEnvironment();
    var tree = useTree();
    var dnd = useDragAndDrop();
    var keys = useKeyboardBindings();
    var descriptors = useMemo(function () { var _a; return (_a = env.liveDescriptors) !== null && _a !== void 0 ? _a : defaultLiveDescriptors; }, [env.liveDescriptors]);
    var MainWrapper = tree.renderers.renderLiveDescriptorContainer;
    if (tree.treeInformation.isRenaming) {
        return (React.createElement(MainWrapper, { tree: tree },
            React.createElement(LiveWrapper, { live: "polite" }, resolveLiveDescriptor(descriptors.renamingItem, env, dnd, tree, keys))));
    }
    if (tree.treeInformation.isSearching) {
        return (React.createElement(MainWrapper, { tree: tree },
            React.createElement(LiveWrapper, { live: "polite" }, resolveLiveDescriptor(descriptors.searching, env, dnd, tree, keys))));
    }
    if (tree.treeInformation.isProgrammaticallyDragging) {
        return (React.createElement(MainWrapper, { tree: tree },
            React.createElement(LiveWrapper, { live: "polite" }, resolveLiveDescriptor(descriptors.programmaticallyDragging, env, dnd, tree, keys)),
            React.createElement(LiveWrapper, { live: "assertive" }, resolveLiveDescriptor(descriptors.programmaticallyDraggingTarget, env, dnd, tree, keys))));
    }
    return (React.createElement(MainWrapper, { tree: tree },
        React.createElement(LiveWrapper, { live: "off" }, resolveLiveDescriptor(descriptors.introduction, env, dnd, tree, keys))));
};
