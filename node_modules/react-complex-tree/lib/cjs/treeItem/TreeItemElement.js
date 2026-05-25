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
exports.TreeItemElement = void 0;
var react_1 = __importStar(require("react"));
var TreeItemChildren_1 = require("./TreeItemChildren");
var useViewState_1 = require("../tree/useViewState");
var Tree_1 = require("../tree/Tree");
var ControlledTreeEnvironment_1 = require("../controlledEnvironment/ControlledTreeEnvironment");
var useTreeItemRenderContext_1 = require("./useTreeItemRenderContext");
var TreeItemRenamingInput_1 = require("./TreeItemRenamingInput");
var TreeItemElement = function (props) {
    var _a, _b, _c, _d;
    var _e = (0, react_1.useState)(false), hasBeenRequested = _e[0], setHasBeenRequested = _e[1];
    var _f = (0, Tree_1.useTree)(), renderers = _f.renderers, treeInformation = _f.treeInformation, renamingItem = _f.renamingItem;
    var environment = (0, ControlledTreeEnvironment_1.useTreeEnvironment)();
    var viewState = (0, useViewState_1.useViewState)();
    var item = environment.items[props.itemIndex];
    var isExpanded = (0, react_1.useMemo)(function () { var _a; return (_a = viewState.expandedItems) === null || _a === void 0 ? void 0 : _a.includes(props.itemIndex); }, [props.itemIndex, viewState.expandedItems]);
    var renderContext = (0, useTreeItemRenderContext_1.useTreeItemRenderContext)(item);
    if (item === undefined || renderContext === undefined) {
        if (!hasBeenRequested) {
            setHasBeenRequested(true);
            (_a = environment.onMissingItems) === null || _a === void 0 ? void 0 : _a.call(environment, [props.itemIndex]);
        }
        return null;
    }
    var shouldRenderChildren = (_c = (_b = environment.shouldRenderChildren) === null || _b === void 0 ? void 0 : _b.call(environment, item, renderContext)) !== null && _c !== void 0 ? _c : (item.isFolder && isExpanded);
    var children = item.children && shouldRenderChildren && (react_1.default.createElement(TreeItemChildren_1.TreeItemChildren, { depth: props.depth + 1, parentId: props.itemIndex }, item.children));
    var title = environment.getItemTitle(item);
    var titleComponent = renamingItem === props.itemIndex ? (react_1.default.createElement(TreeItemRenamingInput_1.TreeItemRenamingInput, { itemIndex: props.itemIndex })) : (renderers.renderItemTitle({
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
exports.TreeItemElement = TreeItemElement;
