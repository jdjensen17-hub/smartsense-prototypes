import { useRef, useState } from 'react';
import { useHtmlElementEventListener } from '../useHtmlElementEventListener';
import { useCallSoon } from '../useCallSoon';
export var useFocusWithin = function (element, onFocusIn, onFocusOut) {
    var _a = useState(false), focusWithin = _a[0], setFocusWithin = _a[1];
    var isLoosingFocusFlag = useRef(false);
    var callSoon = useCallSoon();
    useHtmlElementEventListener(element, 'focusin', function () {
        if (!focusWithin) {
            setFocusWithin(true);
            onFocusIn === null || onFocusIn === void 0 ? void 0 : onFocusIn();
        }
        if (isLoosingFocusFlag.current) {
            isLoosingFocusFlag.current = false;
        }
    });
    useHtmlElementEventListener(element, 'focusout', function () {
        isLoosingFocusFlag.current = true;
        callSoon(function () {
            if (isLoosingFocusFlag.current &&
                !(element === null || element === void 0 ? void 0 : element.contains(document.activeElement))) {
                onFocusOut === null || onFocusOut === void 0 ? void 0 : onFocusOut();
                isLoosingFocusFlag.current = false;
                setFocusWithin(false);
            }
        });
    });
    return focusWithin;
};
