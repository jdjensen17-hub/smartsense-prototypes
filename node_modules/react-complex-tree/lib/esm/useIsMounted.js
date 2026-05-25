import { useEffect, useRef } from 'react';
export var useIsMounted = function () {
    var mountedRef = useRef(false);
    useEffect(function () {
        mountedRef.current = true;
        return function () {
            mountedRef.current = false;
        };
    }, []);
    return mountedRef;
};
