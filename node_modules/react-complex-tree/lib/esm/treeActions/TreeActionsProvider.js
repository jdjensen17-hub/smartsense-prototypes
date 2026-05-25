import * as React from 'react';
import { useMemo } from 'react';
import { useDragAndDrop } from '../drag/DragAndDropProvider';
import { useTreeEnvironment } from '../controlledEnvironment/ControlledTreeEnvironment';
import { useCreatedTreeRef } from './useCreatedTreeRef';
import { useTree } from '../tree/Tree';
import { useEnvironmentActions } from '../environmentActions/EnvironmentActionsProvider';
var EnvironmentActionsContext = React.createContext(null);
export var useTreeActions = function () { return React.useContext(EnvironmentActionsContext); };
export var TreeActionsProvider = React.forwardRef(function (props, ref) {
    useTreeEnvironment();
    var tree = useTree();
    useDragAndDrop();
    var envActions = useEnvironmentActions();
    // TODO change tree childs to use actions rather than output events where possible
    // TODO maybe replace with stable handlers
    var actions = useMemo(function () { return ({
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
    useCreatedTreeRef(ref, actions);
    return (React.createElement(EnvironmentActionsContext.Provider, { value: actions }, props.children));
});
