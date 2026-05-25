import * as React from 'react';
import { useMemo } from 'react';
import { InteractionMode } from '../types';
import { useTreeEnvironment } from './ControlledTreeEnvironment';
import { mergeInteractionManagers } from './mergeInteractionManagers';
import { buildInteractionMode } from './buildInteractionMode';
var InteractionManagerContext = React.createContext(null);
export var useInteractionManager = function () {
    return React.useContext(InteractionManagerContext);
};
export var InteractionManagerProvider = function (_a) {
    var children = _a.children;
    var environment = useTreeEnvironment();
    var defaultInteractionMode = environment.defaultInteractionMode;
    var interactionManager = useMemo(function () {
        var _a;
        if (defaultInteractionMode && typeof defaultInteractionMode !== 'string') {
            if (defaultInteractionMode.extends) {
                return mergeInteractionManagers(defaultInteractionMode, buildInteractionMode(defaultInteractionMode.extends, environment));
            }
            return defaultInteractionMode;
        }
        return buildInteractionMode((_a = defaultInteractionMode) !== null && _a !== void 0 ? _a : InteractionMode.ClickItemToExpand, environment);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // TODO make sure that environment does not need to be refreshed
    return (React.createElement(InteractionManagerContext.Provider, { value: interactionManager }, children));
};
