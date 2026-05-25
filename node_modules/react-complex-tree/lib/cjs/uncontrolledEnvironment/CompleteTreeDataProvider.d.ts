import { Disposable, TreeDataProvider, TreeItem, TreeItemIndex } from '../types';
export declare class CompleteTreeDataProvider<T = any> implements Required<TreeDataProvider<T>> {
    private provider;
    constructor(provider: TreeDataProvider);
    getTreeItem(itemId: TreeItemIndex): Promise<TreeItem>;
    getTreeItems(itemIds: TreeItemIndex[]): Promise<TreeItem[]>;
    onChangeItemChildren(itemId: TreeItemIndex, newChildren: TreeItemIndex[]): Promise<void>;
    onDidChangeTreeData(listener: (changedItemIds: TreeItemIndex[]) => void): Disposable;
    onRenameItem(item: TreeItem<T>, name: string): Promise<void>;
}
