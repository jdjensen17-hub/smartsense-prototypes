import * as React from 'react';
import { TreeContextProps, TreeProps, TreeRef } from '../types';
export declare const useTree: () => TreeContextProps;
export declare const Tree: <T = any>(p: TreeProps<T, never> & {
    ref?: React.Ref<TreeRef<T>> | undefined;
}) => React.ReactElement;
