"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeItemChildren = void 0;
var react_1 = __importDefault(require("react"));
var TreeItemElement_1 = require("./TreeItemElement");
var Tree_1 = require("../tree/Tree");
var TreeItemChildren = function (props) {
    var _a = (0, Tree_1.useTree)(), renderers = _a.renderers, treeInformation = _a.treeInformation;
    var childElements = [];
    for (var _i = 0, _b = props.children; _i < _b.length; _i++) {
        var child = _b[_i];
        childElements.push(react_1.default.createElement(TreeItemElement_1.TreeItemElement, { key: child, itemIndex: child, depth: props.depth }));
    }
    if (childElements.length === 0) {
        return null;
    }
    var containerProps = {
        role: props.depth !== 0 ? 'group' : undefined,
    };
    return renderers.renderItemsContainer({
        children: childElements,
        info: treeInformation,
        containerProps: containerProps,
        depth: props.depth,
        parentId: props.parentId,
    });
};
exports.TreeItemChildren = TreeItemChildren;
