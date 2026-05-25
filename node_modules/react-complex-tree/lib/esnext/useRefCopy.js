import { useRef } from 'react';
export var useRefCopy = function (value) {
    var ref = useRef(value);
    ref.current = value;
    return ref;
};
