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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTreeItemRenderContext = void 0;
var react_1 = require("react");
var defaultMatcher_1 = require("../search/defaultMatcher");
var Tree_1 = require("../tree/Tree");
var ControlledTreeEnvironment_1 = require("../controlledEnvironment/ControlledTreeEnvironment");
var InteractionManagerProvider_1 = require("../controlledEnvironment/InteractionManagerProvider");
var DragAndDropProvider_1 = require("../drag/DragAndDropProvider");
var useSelectUpTo_1 = require("../tree/useSelectUpTo");
var useGetOriginalItemOrder_1 = require("../useGetOriginalItemOrder");
// TODO restructure file. Everything into one hook file without helper methods, let all props be generated outside (InteractionManager and AccessibilityPropsManager), ...
var useTreeItemRenderContext = function (item) {
    var _a, _b, _c, _d;
    var _e = (0, Tree_1.useTree)(), treeId = _e.treeId, search = _e.search, renamingItem = _e.renamingItem, setRenamingItem = _e.setRenamingItem;
    var environment = (0, ControlledTreeEnvironment_1.useTreeEnvironment)();
    var interactionManager = (0, InteractionManagerProvider_1.useInteractionManager)();
    var dnd = (0, DragAndDropProvider_1.useDragAndDrop)();
    var selectUpTo = (0, useSelectUpTo_1.useSelectUpTo)('last-focus');
    var itemTitle = item && environment.getItemTitle(item);
    var getOriginalItemOrder = (0, useGetOriginalItemOrder_1.useGetOriginalItemOrder)();
    var isSearchMatching = (0, react_1.useMemo)(function () {
        var _a;
        return search === null || search.length === 0 || !item || !itemTitle
            ? false
            : ((_a = environment.doesSearchMatchItem) !== null && _a !== void 0 ? _a : defaultMatcher_1.defaultMatcher)(search, item, itemTitle);
    }, [search, item, itemTitle, environment.doesSearchMatchItem]);
    var isSelected = item && ((_b = (_a = environment.viewState[treeId]) === null || _a === void 0 ? void 0 : _a.selectedItems) === null || _b === void 0 ? void 0 : _b.includes(item.index));
    var isExpanded = item && ((_d = (_c = environment.viewState[treeId]) === null || _c === void 0 ? void 0 : _c.expandedItems) === null || _d === void 0 ? void 0 : _d.includes(item.index));
    var isRenaming = item && renamingItem === item.index;
    return (0, react_1.useMemo)(function () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (!item) {
            return undefined;
        }
        var viewState = environment.viewState[treeId];
        var currentlySelectedItems = ((_b = (_a = viewState === null || viewState === void 0 ? void 0 : viewState.selectedItems) === null || _a === void 0 ? void 0 : _a.map(function (item) { return environment.items[item]; })) !== null && _b !== void 0 ? _b : ((viewState === null || viewState === void 0 ? void 0 : viewState.focusedItem)
            ? [environment.items[viewState === null || viewState === void 0 ? void 0 : viewState.focusedItem]]
            : [])).filter(function (item) { return !!item; });
        var isItemPartOfSelectedItems = !!currentlySelectedItems.find(function (selectedItem) { return selectedItem.index === item.index; });
        var canDragCurrentlySelectedItems = currentlySelectedItems &&
            ((_d = (_c = environment.canDrag) === null || _c === void 0 ? void 0 : _c.call(environment, currentlySelectedItems)) !== null && _d !== void 0 ? _d : true) &&
            currentlySelectedItems
                .map(function (item) { var _a; return (_a = item.canMove) !== null && _a !== void 0 ? _a : true; })
                .reduce(function (a, b) { return a && b; }, true);
        var canDragThisItem = ((_f = (_e = environment.canDrag) === null || _e === void 0 ? void 0 : _e.call(environment, [item])) !== null && _f !== void 0 ? _f : true) && ((_g = item.canMove) !== null && _g !== void 0 ? _g : true);
        var canDrag = environment.canDragAndDrop &&
            ((isItemPartOfSelectedItems && canDragCurrentlySelectedItems) ||
                (!isItemPartOfSelectedItems && canDragThisItem));
        var canDropOn = environment.canDragAndDrop &&
            !!((_j = (_h = dnd.viableDragPositions) === null || _h === void 0 ? void 0 : _h[treeId]) === null || _j === void 0 ? void 0 : _j.find(function (position) {
                return position.targetType === 'item' && position.targetItem === item.index;
            }));
        var actions = {
            // TODO disable most actions during rename
            primaryAction: function () {
                var _a;
                (_a = environment.onPrimaryAction) === null || _a === void 0 ? void 0 : _a.call(environment, environment.items[item.index], treeId);
            },
            collapseItem: function () {
                var _a;
                (_a = environment.onCollapseItem) === null || _a === void 0 ? void 0 : _a.call(environment, item, treeId);
            },
            expandItem: function () {
                var _a;
                (_a = environment.onExpandItem) === null || _a === void 0 ? void 0 : _a.call(environment, item, treeId);
            },
            toggleExpandedState: function () {
                var _a, _b;
                if (isExpanded) {
                    (_a = environment.onCollapseItem) === null || _a === void 0 ? void 0 : _a.call(environment, item, treeId);
                }
                else {
                    (_b = environment.onExpandItem) === null || _b === void 0 ? void 0 : _b.call(environment, item, treeId);
                }
            },
            selectItem: function () {
                var _a;
                (_a = environment.onSelectItems) === null || _a === void 0 ? void 0 : _a.call(environment, [item.index], treeId);
            },
            addToSelectedItems: function () {
                var _a, _b;
                (_a = environment.onSelectItems) === null || _a === void 0 ? void 0 : _a.call(environment, __spreadArray(__spreadArray([], ((_b = viewState === null || viewState === void 0 ? void 0 : viewState.selectedItems) !== null && _b !== void 0 ? _b : []), true), [item.index], false), treeId);
            },
            unselectItem: function () {
                var _a, _b, _c;
                (_a = environment.onSelectItems) === null || _a === void 0 ? void 0 : _a.call(environment, (_c = (_b = viewState === null || viewState === void 0 ? void 0 : viewState.selectedItems) === null || _b === void 0 ? void 0 : _b.filter(function (id) { return id !== item.index; })) !== null && _c !== void 0 ? _c : [], treeId);
            },
            selectUpTo: function (overrideOldSelection) {
                selectUpTo(item, overrideOldSelection);
            },
            startRenamingItem: function () {
                setRenamingItem(item.index);
            },
            stopRenamingItem: function () {
                setRenamingItem(null);
            },
            focusItem: function (setDomFocus) {
                var _a;
                if (setDomFocus === void 0) { setDomFocus = true; }
                (_a = environment.onFocusItem) === null || _a === void 0 ? void 0 : _a.call(environment, item, treeId, setDomFocus);
            },
            startDragging: function () {
                var _a, _b;
                var selectedItems = (_a = viewState === null || viewState === void 0 ? void 0 : viewState.selectedItems) !== null && _a !== void 0 ? _a : [];
                if (!selectedItems.includes(item.index)) {
                    selectedItems = [item.index];
                    (_b = environment.onSelectItems) === null || _b === void 0 ? void 0 : _b.call(environment, selectedItems, treeId);
                }
                if (canDrag) {
                    var orderedItems = getOriginalItemOrder(treeId, selectedItems.map(function (id) { return environment.items[id]; }));
                    dnd.onStartDraggingItems(orderedItems, treeId);
                }
            },
        };
        var renderFlags = {
            isSelected: isSelected,
            isExpanded: isExpanded,
            isFocused: (viewState === null || viewState === void 0 ? void 0 : viewState.focusedItem) === item.index,
            isRenaming: isRenaming,
            isDraggingOver: dnd.draggingPosition &&
                dnd.draggingPosition.targetType === 'item' &&
                dnd.draggingPosition.targetItem === item.index &&
                dnd.draggingPosition.treeId === treeId,
            isDraggingOverParent: false,
            isSearchMatching: isSearchMatching,
            canDrag: canDrag,
            canDropOn: canDropOn,
        };
        var interactiveElementProps = __assign(__assign({}, interactionManager.createInteractiveElementProps(item, treeId, actions, renderFlags, viewState)), {
            'data-rct-item-interactive': true,
            'data-rct-item-focus': renderFlags.isFocused ? 'true' : 'false',
            'data-rct-item-id': item.index,
        });
        var itemContainerWithoutChildrenProps = __assign({}, {
            'data-rct-item-container': 'true',
        });
        var itemContainerWithChildrenProps = {
            role: 'treeitem',
            'aria-selected': renderFlags.isSelected,
            'aria-expanded': item.isFolder
                ? renderFlags.isExpanded
                    ? 'true'
                    : 'false'
                : undefined,
        };
        var arrowProps = {
            onClick: function () {
                if (item.isFolder) {
                    actions.toggleExpandedState();
                }
                actions.selectItem();
            },
            onFocus: function () {
                actions.focusItem();
            },
            onDragOver: function (e) {
                e.preventDefault(); // Allow drop
            },
            'aria-hidden': true,
            tabIndex: -1,
        };
        var viewStateFlags = !viewState
            ? {}
            : Object.entries(viewState).reduce(function (acc, _a) {
                var key = _a[0], value = _a[1];
                acc[key] = Array.isArray(value)
                    ? value.includes(item.index)
                    : value === item.index;
                return acc;
            }, {});
        return __assign(__assign(__assign({}, actions), renderFlags), { interactiveElementProps: interactiveElementProps, itemContainerWithChildrenProps: itemContainerWithChildrenProps, itemContainerWithoutChildrenProps: itemContainerWithoutChildrenProps, arrowProps: arrowProps, viewStateFlags: viewStateFlags });
    }, [
        item,
        environment,
        treeId,
        dnd,
        isSelected,
        isExpanded,
        isRenaming,
        isSearchMatching,
        interactionManager,
        selectUpTo,
        setRenamingItem,
        getOriginalItemOrder,
    ]);
};
exports.useTreeItemRenderContext = useTreeItemRenderContext;
