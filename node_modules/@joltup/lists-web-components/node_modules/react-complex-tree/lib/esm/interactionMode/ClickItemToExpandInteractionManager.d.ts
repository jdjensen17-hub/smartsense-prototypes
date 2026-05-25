import { HTMLProps } from 'react';
import { InteractionMode, InteractionManager, TreeEnvironmentContextProps, TreeItem, TreeItemActions, TreeItemRenderFlags } from '../types';
export declare class ClickItemToExpandInteractionManager implements InteractionManager {
    readonly mode = InteractionMode.ClickItemToExpand;
    private environment;
    constructor(environment: TreeEnvironmentContextProps);
    createInteractiveElementProps(item: TreeItem, treeId: string, actions: TreeItemActions, renderFlags: TreeItemRenderFlags): HTMLProps<HTMLElement>;
}
