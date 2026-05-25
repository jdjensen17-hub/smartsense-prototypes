"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLiveDescriptors = void 0;
exports.defaultLiveDescriptors = {
    introduction: "\n    <p>Accessibility guide for tree {treeLabel}.</p>\n    <p>\n      Navigate the tree with the arrow keys. Common tree hotkeys apply. Further keybindings are available:\n    </p>\n    <ul>\n      <li>{keybinding:primaryAction} to execute primary action on focused item</li>\n      <li>{keybinding:renameItem} to start renaming the focused item</li>\n      <li>{keybinding:abortRenameItem} to abort renaming an item</li>\n      <li>{keybinding:startProgrammaticDnd} to start dragging selected items</li>\n    </ul>\n  ",
    renamingItem: "\n    <p>Renaming the item {renamingItem}.</p>\n    <p>Use the keybinding {keybinding:abortRenameItem} to abort renaming.</p>\n  ",
    searching: "\n    <p>Searching</p>\n  ",
    programmaticallyDragging: "\n    <p>Dragging items {dragItems}.</p>\n    <p>Press the arrow keys to move the drag target.</p>\n    <p>Press {keybinding:completeProgrammaticDnd} to drop or {keybinding:abortProgrammaticDnd} to abort.</p>\n  ",
    programmaticallyDraggingTarget: "\n    <p>Drop target is {dropTarget}.</p>\n  ",
};
