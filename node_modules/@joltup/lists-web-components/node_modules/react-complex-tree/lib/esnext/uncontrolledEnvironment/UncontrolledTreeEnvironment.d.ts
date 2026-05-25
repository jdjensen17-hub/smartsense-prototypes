import * as React from 'react';
import { TreeEnvironmentRef, UncontrolledTreeEnvironmentProps } from '../types';
export declare const UncontrolledTreeEnvironment: <T = any, C extends string = never>(p: UncontrolledTreeEnvironmentProps<T, C> & {
    ref?: React.Ref<TreeEnvironmentRef<T, C>> | undefined;
}) => React.ReactElement;
