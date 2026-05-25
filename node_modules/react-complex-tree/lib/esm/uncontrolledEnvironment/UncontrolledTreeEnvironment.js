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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ControlledTreeEnvironment } from '../controlledEnvironment/ControlledTreeEnvironment';
import { CompleteTreeDataProvider } from './CompleteTreeDataProvider';
import { useIsMounted } from '../useIsMounted';
import { useRefCopy } from '../useRefCopy';
/* const createCompleteDataProvider = (provider: TreeDataProvider): CompleteTreeDataProvider => ({ // TODO Write class that internally uses provider instead
  ...provider,
  getTreeItem: provider.getTreeItem,
  onDidChangeTreeData: provider.onDidChangeTreeData?.bind(provider) ?? (() => ({ dispose: () => {} })),
  getTreeItems: provider.getTreeItems?.bind(provider) ?? (itemIds => Promise.all(itemIds.map(id => provider.getTreeItem(id)))),
  onRenameItem: provider.onRenameItem?.bind(provider) ?? (async () => {}),
  onChangeItemChildren: provider.onChangeItemChildren?.bind(provider) ?? (async () => {}),
}); */
export var UncontrolledTreeEnvironment = React.forwardRef(function (props, ref) {
    var _a = useState({}), currentItems = _a[0], setCurrentItems = _a[1];
    var _b = useState(props.viewState), viewState = _b[0], setViewState = _b[1];
    var viewStateRef = useRefCopy(viewState);
    var missingItemIds = useRef([]);
    var dataProvider = useMemo(function () { return new CompleteTreeDataProvider(props.dataProvider); }, [props.dataProvider]);
    var isMounted = useIsMounted();
    var writeItems = useCallback(function (newItems) {
        if (!isMounted.current)
            return;
        setCurrentItems(function (oldItems) { return (__assign(__assign({}, oldItems), newItems)); });
    }, [isMounted]);
    var amendViewState = useCallback(function (treeId, constructNewState) {
        setViewState(function (oldState) {
            var _a;
            var _b;
            return (__assign(__assign({}, oldState), (_a = {}, _a[treeId] = __assign(__assign({}, oldState[treeId]), constructNewState((_b = oldState[treeId]) !== null && _b !== void 0 ? _b : {})), _a)));
        });
    }, []);
    useEffect(function () {
        var dispose = dataProvider.onDidChangeTreeData(function (changedItemIds) {
            dataProvider.getTreeItems(changedItemIds).then(function (items) {
                writeItems(items
                    .map(function (item) {
                    var _a;
                    return (_a = {}, _a[item.index] = item, _a);
                })
                    .reduce(function (a, b) { return (__assign(__assign({}, a), b)); }, {}));
            });
        }).dispose;
        return dispose;
    }, [dataProvider, writeItems]);
    // TODO memoize props or this component itself
    return (React.createElement(ControlledTreeEnvironment, __assign({}, props, { ref: ref, viewState: viewState, items: currentItems, onExpandItem: function (item, treeId) {
            var _a;
            amendViewState(treeId, function (old) {
                var _a;
                return (__assign(__assign({}, old), { expandedItems: __spreadArray(__spreadArray([], ((_a = old.expandedItems) !== null && _a !== void 0 ? _a : []), true), [item.index], false) }));
            });
            (_a = props.onExpandItem) === null || _a === void 0 ? void 0 : _a.call(props, item, treeId);
        }, onCollapseItem: function (item, treeId) {
            var _a;
            amendViewState(treeId, function (old) {
                var _a;
                return (__assign(__assign({}, old), { expandedItems: (_a = old.expandedItems) === null || _a === void 0 ? void 0 : _a.filter(function (id) { return id !== item.index; }) }));
            });
            (_a = props.onCollapseItem) === null || _a === void 0 ? void 0 : _a.call(props, item, treeId);
        }, onSelectItems: function (items, treeId) {
            var _a, _b, _c;
            var oldFocusedItem = (_a = viewStateRef.current[treeId]) === null || _a === void 0 ? void 0 : _a.focusedItem;
            if (props.disableMultiselect) {
                var newSelected_1 = oldFocusedItem ? [oldFocusedItem] : [];
                (_b = props.onSelectItems) === null || _b === void 0 ? void 0 : _b.call(props, newSelected_1, treeId);
                amendViewState(treeId, function (old) { return (__assign(__assign({}, old), { selectedItems: newSelected_1 })); });
            }
            else {
                (_c = props.onSelectItems) === null || _c === void 0 ? void 0 : _c.call(props, items, treeId);
                amendViewState(treeId, function (old) { return (__assign(__assign({}, old), { selectedItems: items })); });
            }
        }, onFocusItem: function (item, treeId) {
            var _a;
            amendViewState(treeId, function (old) { return (__assign(__assign({}, old), { focusedItem: item.index })); });
            (_a = props.onFocusItem) === null || _a === void 0 ? void 0 : _a.call(props, item, treeId);
        }, onRenameItem: function (item, name, treeId) { return __awaiter(void 0, void 0, void 0, function () {
            var newItem;
            var _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, dataProvider.onRenameItem(item, name)];
                    case 1:
                        _c.sent();
                        amendViewState(treeId, function (old) { return (__assign(__assign({}, old), { renamingItem: undefined })); });
                        return [4 /*yield*/, dataProvider.getTreeItem(item.index)];
                    case 2:
                        newItem = _c.sent();
                        writeItems((_a = {}, _a[item.index] = newItem, _a));
                        (_b = props.onRenameItem) === null || _b === void 0 ? void 0 : _b.call(props, item, name, treeId);
                        return [2 /*return*/];
                }
            });
        }); }, onDrop: function (items, target) { return __awaiter(void 0, void 0, void 0, function () {
            var promises, itemsIndices, itemsPriorToInsertion, _loop_1, _i, items_1, item, state_1, newParent, newParentChildren;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        promises = [];
                        itemsIndices = items.map(function (i) { return i.index; });
                        itemsPriorToInsertion = 0;
                        _loop_1 = function (item) {
                            var parent_1 = Object.values(currentItems).find(function (potentialParent) { var _a, _b; return (_b = (_a = potentialParent === null || potentialParent === void 0 ? void 0 : potentialParent.children) === null || _a === void 0 ? void 0 : _a.includes) === null || _b === void 0 ? void 0 : _b.call(_a, item.index); });
                            if (!parent_1) {
                                throw Error("Could not find parent of item \"".concat(item.index, "\""));
                            }
                            if (!parent_1.children) {
                                throw Error("Parent \"".concat(parent_1.index, "\" of item \"").concat(item.index, "\" did not have any children"));
                            }
                            if (target.targetType === 'between-items' &&
                                target.parentItem === item.index) {
                                return { value: void 0 };
                            }
                            if ((target.targetType === 'item' || target.targetType === 'root') &&
                                target.targetItem !== parent_1.index) {
                                promises.push(dataProvider.onChangeItemChildren(parent_1.index, parent_1.children.filter(function (child) { return child !== item.index; })));
                            }
                            if (target.targetType === 'between-items') {
                                if (target.parentItem === parent_1.index) {
                                    var newParent = currentItems[target.parentItem];
                                    var isOldItemPriorToNewItem = ((_b = ((_a = newParent.children) !== null && _a !== void 0 ? _a : []).findIndex(function (child) { return child === item.index; })) !== null && _b !== void 0 ? _b : Infinity) < target.childIndex;
                                    itemsPriorToInsertion += isOldItemPriorToNewItem ? 1 : 0;
                                }
                                else {
                                    promises.push(dataProvider.onChangeItemChildren(parent_1.index, parent_1.children.filter(function (child) { return child !== item.index; })));
                                }
                            }
                        };
                        // move old items out
                        for (_i = 0, items_1 = items; _i < items_1.length; _i++) {
                            item = items_1[_i];
                            state_1 = _loop_1(item);
                            if (typeof state_1 === "object")
                                return [2 /*return*/, state_1.value];
                        }
                        // insert new items
                        if (target.targetType === 'item' || target.targetType === 'root') {
                            promises.push(dataProvider.onChangeItemChildren(target.targetItem, __spreadArray(__spreadArray([], ((_c = currentItems[target.targetItem].children) !== null && _c !== void 0 ? _c : []).filter(function (i) { return !itemsIndices.includes(i); }), true), itemsIndices, true)));
                        }
                        else {
                            newParent = currentItems[target.parentItem];
                            newParentChildren = __spreadArray([], ((_d = newParent.children) !== null && _d !== void 0 ? _d : []), true).filter(function (c) { return !itemsIndices.includes(c); });
                            newParentChildren.splice.apply(newParentChildren, __spreadArray([target.childIndex - itemsPriorToInsertion,
                                0], itemsIndices, false));
                            promises.push(dataProvider.onChangeItemChildren(target.parentItem, newParentChildren));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _f.sent();
                        (_e = props.onDrop) === null || _e === void 0 ? void 0 : _e.call(props, items, target);
                        return [2 /*return*/];
                }
            });
        }); }, onMissingItems: function (itemIds) {
            var _a;
            var _b;
            // Batch individual fetch-item-calls together
            if (missingItemIds.current.length === 0) {
                setTimeout(function () {
                    dataProvider.getTreeItems(missingItemIds.current).then(function (items) {
                        writeItems(items
                            .map(function (item) {
                            var _a;
                            return (_a = {}, _a[item === null || item === void 0 ? void 0 : item.index] = item, _a);
                        })
                            .reduce(function (a, b) { return (__assign(__assign({}, a), b)); }, {}));
                    });
                    missingItemIds.current = [];
                });
            }
            (_a = missingItemIds.current).push.apply(_a, itemIds);
            (_b = props.onMissingItems) === null || _b === void 0 ? void 0 : _b.call(props, itemIds);
        } }), props.children));
});
