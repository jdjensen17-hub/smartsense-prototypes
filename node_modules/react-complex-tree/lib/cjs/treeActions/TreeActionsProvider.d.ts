import * as React from 'react';
import { TreeChangeActions, TreeRef } from '../types';
export declare const useTreeActions: () => TreeChangeActions;
export declare const TreeActionsProvider: React.ForwardRefExoticComponent<Pick<React.PropsWithChildren<Record<string, unknown>>, string> & React.RefAttributes<TreeRef<any>>>;
