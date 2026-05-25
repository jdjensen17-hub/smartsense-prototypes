"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionManagerProvider = exports.useInteractionManager = void 0;
var React = __importStar(require("react"));
var react_1 = require("react");
var types_1 = require("../types");
var ControlledTreeEnvironment_1 = require("./ControlledTreeEnvironment");
var mergeInteractionManagers_1 = require("./mergeInteractionManagers");
var buildInteractionMode_1 = require("./buildInteractionMode");
var InteractionManagerContext = React.createContext(null);
var useInteractionManager = function () {
    return React.useContext(InteractionManagerContext);
};
exports.useInteractionManager = useInteractionManager;
var InteractionManagerProvider = function (_a) {
    var children = _a.children;
    var environment = (0, ControlledTreeEnvironment_1.useTreeEnvironment)();
    var defaultInteractionMode = environment.defaultInteractionMode;
    var interactionManager = (0, react_1.useMemo)(function () {
        var _a;
        if (defaultInteractionMode && typeof defaultInteractionMode !== 'string') {
            if (defaultInteractionMode.extends) {
                return (0, mergeInteractionManagers_1.mergeInteractionManagers)(defaultInteractionMode, (0, buildInteractionMode_1.buildInteractionMode)(defaultInteractionMode.extends, environment));
            }
            return defaultInteractionMode;
        }
        return (0, buildInteractionMode_1.buildInteractionMode)((_a = defaultInteractionMode) !== null && _a !== void 0 ? _a : types_1.InteractionMode.ClickItemToExpand, environment);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // TODO make sure that environment does not need to be refreshed
    return (React.createElement(InteractionManagerContext.Provider, { value: interactionManager }, children));
};
exports.InteractionManagerProvider = InteractionManagerProvider;
