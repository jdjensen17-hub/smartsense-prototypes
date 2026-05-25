"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLiveDescriptor = void 0;
var resolveLiveDescriptor = function (descriptor, environment, dnd, tree, keyboardBindings) {
    var getItemTitle = function (index) {
        return environment.getItemTitle(environment.items[index]);
    };
    return descriptor.replace(/({[^\s}]+)}/g, function (variableNameWithBrackets) {
        var _a, _b, _c;
        var variableName = variableNameWithBrackets.slice(1, -1);
        switch (variableName) {
            case 'treeLabel':
                return (_a = tree.treeLabel) !== null && _a !== void 0 ? _a : '';
            case 'renamingItem':
                return tree.renamingItem ? getItemTitle(tree.renamingItem) : 'None';
            case 'dragItems':
                return ((_c = (_b = dnd.draggingItems) === null || _b === void 0 ? void 0 : _b.map(function (item) { return environment.getItemTitle(item); }).join(', ')) !== null && _c !== void 0 ? _c : 'None');
            case 'dropTarget': {
                if (!dnd.draggingPosition) {
                    return 'None';
                }
                if (dnd.draggingPosition.targetType === 'item' ||
                    dnd.draggingPosition.targetType === 'root') {
                    return "within ".concat(getItemTitle(dnd.draggingPosition.targetItem));
                }
                var parentItem = environment.items[dnd.draggingPosition.parentItem];
                var parentTitle = environment.getItemTitle(parentItem);
                if (dnd.draggingPosition.childIndex === 0) {
                    return "within ".concat(parentTitle, " at the start");
                }
                return "within ".concat(parentTitle, " after ").concat(getItemTitle(parentItem.children[dnd.draggingPosition.childIndex - 1]));
            }
            default:
                if (variableName.startsWith('keybinding:')) {
                    return keyboardBindings[variableName.slice(11)][0];
                }
                throw Error("Unknown live descriptor variable {".concat(variableName, "}"));
        }
    });
};
exports.resolveLiveDescriptor = resolveLiveDescriptor;
