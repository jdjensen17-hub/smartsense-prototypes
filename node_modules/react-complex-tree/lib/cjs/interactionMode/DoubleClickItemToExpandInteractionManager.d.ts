import { HTMLProps } from 'react';
import { InteractionMode, InteractionManager, TreeEnvironmentContextProps, TreeItem, TreeItemActions, TreeItemRenderFlags } from '../types';
export declare class DoubleClickItemToExpandInteractionManager implements InteractionManager {
    readonly mode = InteractionMode.DoubleClickItemToExpand;
    private environment;
    constructor(environment: TreeEnvironmentContextProps);
    createInteractiveElementProps(item: TreeItem, treeId: string, actions: TreeItemActions, renderFlags: TreeItemRenderFlags): HTMLProps<HTMLElement>;
}
