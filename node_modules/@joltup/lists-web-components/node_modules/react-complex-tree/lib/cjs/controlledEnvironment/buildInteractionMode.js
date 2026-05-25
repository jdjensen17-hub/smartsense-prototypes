"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInteractionMode = void 0;
var types_1 = require("../types");
var DoubleClickItemToExpandInteractionManager_1 = require("../interactionMode/DoubleClickItemToExpandInteractionManager");
var ClickItemToExpandInteractionManager_1 = require("../interactionMode/ClickItemToExpandInteractionManager");
var ClickArrowToExpandInteractionManager_1 = require("../interactionMode/ClickArrowToExpandInteractionManager");
var buildInteractionMode = function (mode, environment) {
    switch (mode) {
        case types_1.InteractionMode.DoubleClickItemToExpand:
            return new DoubleClickItemToExpandInteractionManager_1.DoubleClickItemToExpandInteractionManager(environment);
        case types_1.InteractionMode.ClickItemToExpand:
            return new ClickItemToExpandInteractionManager_1.ClickItemToExpandInteractionManager(environment);
        case types_1.InteractionMode.ClickArrowToExpand:
            return new ClickArrowToExpandInteractionManager_1.ClickArrowToExpandInteractionManager(environment);
        default:
            throw Error("Unknown interaction mode ".concat(mode));
    }
};
exports.buildInteractionMode = buildInteractionMode;
