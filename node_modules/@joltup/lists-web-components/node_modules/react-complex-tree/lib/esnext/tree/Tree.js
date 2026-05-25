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
import * as React from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useTreeEnvironment } from '../controlledEnvironment/ControlledTreeEnvironment';
import { TreeManager } from './TreeManager';
import { useCreatedTreeInformation } from './useCreatedTreeInformation';
import { getItemsLinearly } from './getItemsLinearly';
import { TreeActionsProvider } from '../treeActions/TreeActionsProvider';
var TreeContext = React.createContext(null); // TODO default value
export var useTree = function () { return useContext(TreeContext); };
export var Tree = React.forwardRef(function (props, ref) {
    var _a;
    var environment = useTreeEnvironment();
    var renderers = useMemo(function () { return (__assign(__assign({}, environment), props)); }, [props, environment]);
    var _b = useState(null), search = _b[0], setSearch = _b[1];
    var _c = useState(null), renamingItem = _c[0], setRenamingItem = _c[1];
    var rootItem = environment.items[props.rootItem];
    var viewState = environment.viewState[props.treeId];
    useEffect(function () {
        environment.registerTree({
            treeId: props.treeId,
            rootItem: props.rootItem,
        });
        return function () { return environment.unregisterTree(props.treeId); };
        // TODO should be able to remove soon, and add environment.registerTree, environment.unregisterTree as deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.treeId, props.rootItem]);
    var treeInformation = useCreatedTreeInformation(props, renamingItem, search);
    var treeContextProps = useMemo(function () { return ({
        treeId: props.treeId,
        rootItem: props.rootItem,
        treeLabel: props.treeLabel,
        treeLabelledBy: props.treeLabelledBy,
        getItemsLinearly: function () {
            return getItemsLinearly(props.rootItem, viewState !== null && viewState !== void 0 ? viewState : {}, environment.items);
        },
        treeInformation: treeInformation,
        search: search,
        setSearch: setSearch,
        renamingItem: renamingItem,
        setRenamingItem: setRenamingItem,
        renderers: renderers,
    }); }, [
        environment.items,
        props.rootItem,
        props.treeId,
        props.treeLabel,
        props.treeLabelledBy,
        renamingItem,
        renderers,
        search,
        treeInformation,
        viewState,
    ]);
    if (rootItem === undefined) {
        (_a = environment.onMissingItems) === null || _a === void 0 ? void 0 : _a.call(environment, [props.rootItem]);
        return null;
    }
    return (React.createElement(TreeContext.Provider, { value: treeContextProps },
        React.createElement(TreeActionsProvider, { ref: ref },
            React.createElement(TreeManager, null))));
});
