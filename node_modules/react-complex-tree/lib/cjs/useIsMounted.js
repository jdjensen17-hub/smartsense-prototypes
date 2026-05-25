"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIsMounted = void 0;
var react_1 = require("react");
var useIsMounted = function () {
    var mountedRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(function () {
        mountedRef.current = true;
        return function () {
            mountedRef.current = false;
        };
    }, []);
    return mountedRef;
};
exports.useIsMounted = useIsMounted;
