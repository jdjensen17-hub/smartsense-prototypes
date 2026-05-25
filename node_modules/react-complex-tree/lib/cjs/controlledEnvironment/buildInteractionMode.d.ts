import { InteractionMode, TreeEnvironmentContextProps } from '../types';
import { DoubleClickItemToExpandInteractionManager } from '../interactionMode/DoubleClickItemToExpandInteractionManager';
import { ClickItemToExpandInteractionManager } from '../interactionMode/ClickItemToExpandInteractionManager';
import { ClickArrowToExpandInteractionManager } from '../interactionMode/ClickArrowToExpandInteractionManager';
export declare const buildInteractionMode: (mode: InteractionMode, environment: TreeEnvironmentContextProps) => DoubleClickItemToExpandInteractionManager | ClickItemToExpandInteractionManager | ClickArrowToExpandInteractionManager;
