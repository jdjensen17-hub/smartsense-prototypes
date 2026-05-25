import * as React from 'react';
import { ControlledTreeEnvironmentProps, TreeEnvironmentContextProps, TreeEnvironmentRef } from '../types';
export declare const useTreeEnvironment: () => TreeEnvironmentContextProps<any, never>;
export declare const ControlledTreeEnvironment: <T = any, C extends string = never>(p: ControlledTreeEnvironmentProps<T, C> & {
    ref?: React.Ref<TreeEnvironmentRef<T, C>> | undefined;
}) => React.ReactElement;
