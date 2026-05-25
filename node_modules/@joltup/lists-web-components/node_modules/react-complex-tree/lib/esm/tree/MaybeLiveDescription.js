import * as React from 'react';
import { useTreeEnvironment } from '../controlledEnvironment/ControlledTreeEnvironment';
import { LiveDescription } from './LiveDescription';
export var MaybeLiveDescription = function () {
    var _a;
    var env = useTreeEnvironment();
    if (!((_a = env.showLiveDescription) !== null && _a !== void 0 ? _a : true)) {
        return null;
    }
    return React.createElement(LiveDescription, null);
};
