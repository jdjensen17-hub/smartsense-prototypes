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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchInput = void 0;
var useHtmlElementEventListener_1 = require("../useHtmlElementEventListener");
var useHotkey_1 = require("../hotkeys/useHotkey");
var Tree_1 = require("../tree/Tree");
var ControlledTreeEnvironment_1 = require("../controlledEnvironment/ControlledTreeEnvironment");
var useSearchMatchFocus_1 = require("./useSearchMatchFocus");
var useViewState_1 = require("../tree/useViewState");
var useCallSoon_1 = require("../useCallSoon");
var utils_1 = require("../utils");
var SearchInput = function (_a) {
    var _b;
    var containerRef = _a.containerRef;
    var _c = (0, Tree_1.useTree)(), search = _c.search, setSearch = _c.setSearch, treeId = _c.treeId, renderers = _c.renderers, renamingItem = _c.renamingItem;
    var environment = (0, ControlledTreeEnvironment_1.useTreeEnvironment)();
    (0, useViewState_1.useViewState)();
    var isActiveTree = environment.activeTreeId === treeId;
    var callSoon = (0, useCallSoon_1.useCallSoon)();
    (0, useSearchMatchFocus_1.useSearchMatchFocus)();
    var clearSearch = function () {
        var _a, _b, _c;
        setSearch(null);
        if ((_a = environment.autoFocus) !== null && _a !== void 0 ? _a : true) {
            // Refocus item in tree
            // TODO move logic as reusable method into tree or tree environment
            var focusItem = (_b = (0, utils_1.getDocument)()) === null || _b === void 0 ? void 0 : _b.querySelector("[data-rct-tree=\"".concat(treeId, "\"] [data-rct-item-focus=\"true\"]"));
            (_c = focusItem === null || focusItem === void 0 ? void 0 : focusItem.focus) === null || _c === void 0 ? void 0 : _c.call(focusItem);
        }
    };
    (0, useHotkey_1.useHotkey)('abortSearch', function () {
        // Without the callSoon, hitting enter to abort
        // and then moving focus weirdly moves the selected item along
        // with the focused item.
        callSoon(function () {
            clearSearch();
        });
    }, isActiveTree && search !== null, true);
    (0, useHtmlElementEventListener_1.useHtmlElementEventListener)(containerRef, 'keydown', function (e) {
        var _a, _b;
        var unicode = e.key.charCodeAt(0);
        if (((_a = environment.canSearch) !== null && _a !== void 0 ? _a : true) &&
            ((_b = environment.canSearchByStartingTyping) !== null && _b !== void 0 ? _b : true) &&
            isActiveTree &&
            search === null &&
            !renamingItem &&
            !e.ctrlKey &&
            !e.shiftKey &&
            !e.altKey &&
            !e.metaKey &&
            ((unicode >= 48 && unicode <= 57) || // number
                // (unicode >= 65 && unicode <= 90) || // uppercase letter
                (unicode >= 97 && unicode <= 122)) // lowercase letter
        ) {
            setSearch('');
        }
    });
    if (!((_b = environment.canSearch) !== null && _b !== void 0 ? _b : true) || search === null) {
        return null;
    }
    return renderers.renderSearchInput({
        inputProps: __assign({ value: search, onChange: function (e) { return setSearch(e.target.value); }, onBlur: function () {
                clearSearch();
            }, ref: function (el) {
                var _a;
                (_a = el === null || el === void 0 ? void 0 : el.focus) === null || _a === void 0 ? void 0 : _a.call(el);
            }, 'aria-label': 'Search for items' }, {
            'data-rct-search-input': 'true',
        }),
    });
};
exports.SearchInput = SearchInput;
