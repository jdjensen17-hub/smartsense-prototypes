"use strict";
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
exports.Tree = exports.useTree = void 0;
var React = __importStar(require("react"));
var react_1 = require("react");
var ControlledTreeEnvironment_1 = require("../controlledEnvironment/ControlledTreeEnvironment");
var TreeManager_1 = require("./TreeManager");
var useCreatedTreeInformation_1 = require("./useCreatedTreeInformation");
var getItemsLinearly_1 = require("./getItemsLinearly");
var TreeActionsProvider_1 = require("../treeActions/TreeActionsProvider");
var TreeContext = React.createContext(null); // TODO default value
var useTree = function () { return (0, react_1.useContext)(TreeContext); };
exports.useTree = useTree;
exports.Tree = React.forwardRef(function (props, ref) {
    var _a;
    var environment = (0, ControlledTreeEnvironment_1.useTreeEnvironment)();
    var renderers = (0, react_1.useMemo)(function () { return (__assign(__assign({}, environment), props)); }, [props, environment]);
    var _b = (0, react_1.useState)(null), search = _b[0], setSearch = _b[1];
    var _c = (0, react_1.useState)(null), renamingItem = _c[0], setRenamingItem = _c[1];
    var rootItem = environment.items[props.rootItem];
    var viewState = environment.viewState[props.treeId];
    (0, react_1.useEffect)(function () {
        environment.registerTree({
            treeId: props.treeId,
            rootItem: props.rootItem,
        });
        return function () { return environment.unregisterTree(props.treeId); };
        // TODO should be able to remove soon, and add environment.registerTree, environment.unregisterTree as deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.treeId, props.rootItem]);
    var treeInformation = (0, useCreatedTreeInformation_1.useCreatedTreeInformation)(props, renamingItem, search);
    var treeContextProps = (0, react_1.useMemo)(function () { return ({
        treeId: props.treeId,
        rootItem: props.rootItem,
        treeLabel: props.treeLabel,
        treeLabelledBy: props.treeLabelledBy,
        getItemsLinearly: function () {
            return (0, getItemsLinearly_1.getItemsLinearly)(props.rootItem, viewState !== null && viewState !== void 0 ? viewState : {}, environment.items);
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
        React.createElement(TreeActionsProvider_1.TreeActionsProvider, { ref: ref },
            React.createElement(TreeManager_1.TreeManager, null))));
});
