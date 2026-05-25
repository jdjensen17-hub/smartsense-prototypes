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
exports.TreeActionsProvider = exports.useTreeActions = void 0;
var React = __importStar(require("react"));
var react_1 = require("react");
var DragAndDropProvider_1 = require("../drag/DragAndDropProvider");
var ControlledTreeEnvironment_1 = require("../controlledEnvironment/ControlledTreeEnvironment");
var useCreatedTreeRef_1 = require("./useCreatedTreeRef");
var Tree_1 = require("../tree/Tree");
var EnvironmentActionsProvider_1 = require("../environmentActions/EnvironmentActionsProvider");
var EnvironmentActionsContext = React.createContext(null);
var useTreeActions = function () { return React.useContext(EnvironmentActionsContext); };
exports.useTreeActions = useTreeActions;
exports.TreeActionsProvider = React.forwardRef(function (props, ref) {
    (0, ControlledTreeEnvironment_1.useTreeEnvironment)();
    var tree = (0, Tree_1.useTree)();
    (0, DragAndDropProvider_1.useDragAndDrop)();
    var envActions = (0, EnvironmentActionsProvider_1.useEnvironmentActions)();
    // TODO change tree childs to use actions rather than output events where possible
    // TODO maybe replace with stable handlers
    var actions = (0, react_1.useMemo)(function () { return ({
        abortRenamingItem: function () {
            tree.setRenamingItem(null);
        },
        abortSearch: function () {
            tree.setSearch(null);
        },
        collapseItem: function (itemId) {
            envActions.collapseItem(itemId, tree.treeId);
        },
        completeRenamingItem: function () {
            // TODO
        },
        expandItem: function (itemId) {
            envActions.expandItem(itemId, tree.treeId);
        },
        focusItem: function (itemId, setDomFocus) {
            if (setDomFocus === void 0) { setDomFocus = true; }
            envActions.focusItem(itemId, tree.treeId, setDomFocus);
        },
        focusTree: function (autoFocus) {
            if (autoFocus === void 0) { autoFocus = true; }
            envActions.focusTree(tree.treeId, autoFocus);
        },
        invokePrimaryAction: function (itemId) {
            envActions.invokePrimaryAction(itemId, tree.treeId);
        },
        moveFocusDown: function () {
            envActions.moveFocusDown(tree.treeId);
        },
        moveFocusUp: function () {
            envActions.moveFocusUp(tree.treeId);
        },
        renameItem: function (itemId, name) {
            envActions.renameItem(itemId, name, tree.treeId);
        },
        selectItems: function (itemsIds) {
            envActions.selectItems(itemsIds, tree.treeId);
        },
        setSearch: function (search) {
            tree.setSearch(search);
        },
        startRenamingItem: function (itemId) {
            tree.setRenamingItem(itemId);
        },
        stopRenamingItem: function () {
            tree.setRenamingItem(null);
        },
        toggleItemExpandedState: function (itemId) {
            envActions.toggleItemExpandedState(itemId, tree.treeId);
        },
        toggleItemSelectStatus: function (itemId) {
            envActions.toggleItemSelectStatus(itemId, tree.treeId);
        },
        expandAll: function () {
            envActions.expandAll(tree.treeId);
        },
        collapseAll: function () {
            envActions.collapseAll(tree.treeId);
        },
        expandSubsequently: function (itemIds) {
            return envActions.expandSubsequently(tree.treeId, itemIds);
        },
    }); }, [envActions, tree]);
    (0, useCreatedTreeRef_1.useCreatedTreeRef)(ref, actions);
    return (React.createElement(EnvironmentActionsContext.Provider, { value: actions }, props.children));
});
