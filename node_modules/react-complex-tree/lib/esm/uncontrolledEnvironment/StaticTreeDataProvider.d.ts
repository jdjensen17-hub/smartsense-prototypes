import { Disposable, TreeDataProvider, TreeItem, TreeItemIndex } from '../types';
import { EventEmitter } from '../EventEmitter';
export declare class StaticTreeDataProvider<T = any> implements TreeDataProvider {
    private data;
    /** Emit an event with the changed item ids to notify the tree view about changes. */
    readonly onDidChangeTreeDataEmitter: EventEmitter<TreeItemIndex[]>;
    private setItemName?;
    constructor(items: Record<TreeItemIndex, TreeItem<T>>, setItemName?: (item: TreeItem<T>, newName: string) => TreeItem<T>);
    getTreeItem(itemId: TreeItemIndex): Promise<TreeItem>;
    onChangeItemChildren(itemId: TreeItemIndex, newChildren: TreeItemIndex[]): Promise<void>;
    onDidChangeTreeData(listener: (changedItemIds: TreeItemIndex[]) => void): Disposable;
    onRenameItem(item: TreeItem<any>, name: string): Promise<void>;
}
