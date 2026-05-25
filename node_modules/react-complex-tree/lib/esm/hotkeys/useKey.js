import { useHtmlElementEventListener } from '../useHtmlElementEventListener';
import { getDocument } from '../utils';
export var useKey = function (key, onHit, active) {
    useHtmlElementEventListener(getDocument(), 'keydown', function (e) {
        if (!active) {
            return;
        }
        if (active && key.toLowerCase() === e.key.toLowerCase()) {
            onHit(e);
        }
    });
};
