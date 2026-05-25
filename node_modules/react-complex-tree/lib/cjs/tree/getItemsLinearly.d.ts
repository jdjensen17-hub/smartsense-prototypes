import { IndividualTreeViewState, LinearItem, TreeItem, TreeItemIndex } from '../types';
export declare const getItemsLinearly: <T, C extends string>(rootItem: TreeItemIndex, viewState: IndividualTreeViewState<C>, items: Record<TreeItemIndex, TreeItem<T>>, depth?: number) => LinearItem[];
