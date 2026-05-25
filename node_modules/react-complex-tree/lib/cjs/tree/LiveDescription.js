"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveDescription = void 0;
var React = __importStar(require("react"));
var react_1 = require("react");
var ControlledTreeEnvironment_1 = require("../controlledEnvironment/ControlledTreeEnvironment");
var defaultLiveDescriptors_1 = require("./defaultLiveDescriptors");
var Tree_1 = require("./Tree");
var DragAndDropProvider_1 = require("../drag/DragAndDropProvider");
var resolveLiveDescriptor_1 = require("./resolveLiveDescriptor");
var useKeyboardBindings_1 = require("../hotkeys/useKeyboardBindings");
var LiveWrapper = function (_a) {
    var children = _a.children, live = _a.live;
    return React.createElement("div", { "aria-live": live, dangerouslySetInnerHTML: { __html: children } });
};
var LiveDescription = function () {
    var env = (0, ControlledTreeEnvironment_1.useTreeEnvironment)();
    var tree = (0, Tree_1.useTree)();
    var dnd = (0, DragAndDropProvider_1.useDragAndDrop)();
    var keys = (0, useKeyboardBindings_1.useKeyboardBindings)();
    var descriptors = (0, react_1.useMemo)(function () { var _a; return (_a = env.liveDescriptors) !== null && _a !== void 0 ? _a : defaultLiveDescriptors_1.defaultLiveDescriptors; }, [env.liveDescriptors]);
    var MainWrapper = tree.renderers.renderLiveDescriptorContainer;
    if (tree.treeInformation.isRenaming) {
        return (React.createElement(MainWrapper, { tree: tree },
            React.createElement(LiveWrapper, { live: "polite" }, (0, resolveLiveDescriptor_1.resolveLiveDescriptor)(descriptors.renamingItem, env, dnd, tree, keys))));
    }
    if (tree.treeInformation.isSearching) {
        return (React.createElement(MainWrapper, { tree: tree },
            React.createElement(LiveWrapper, { live: "polite" }, (0, resolveLiveDescriptor_1.resolveLiveDescriptor)(descriptors.searching, env, dnd, tree, keys))));
    }
    if (tree.treeInformation.isProgrammaticallyDragging) {
        return (React.createElement(MainWrapper, { tree: tree },
            React.createElement(LiveWrapper, { live: "polite" }, (0, resolveLiveDescriptor_1.resolveLiveDescriptor)(descriptors.programmaticallyDragging, env, dnd, tree, keys)),
            React.createElement(LiveWrapper, { live: "assertive" }, (0, resolveLiveDescriptor_1.resolveLiveDescriptor)(descriptors.programmaticallyDraggingTarget, env, dnd, tree, keys))));
    }
    return (React.createElement(MainWrapper, { tree: tree },
        React.createElement(LiveWrapper, { live: "off" }, (0, resolveLiveDescriptor_1.resolveLiveDescriptor)(descriptors.introduction, env, dnd, tree, keys))));
};
exports.LiveDescription = LiveDescription;
