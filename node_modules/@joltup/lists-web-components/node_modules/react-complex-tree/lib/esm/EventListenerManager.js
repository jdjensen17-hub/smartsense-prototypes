var EventListenerManager = /** @class */ (function () {
    function EventListenerManager() {
        this.handlers = {};
    }
    EventListenerManager.prototype.addEventListener = function (type, listener) {
        if (!this.handlers[type]) {
            this.handlers[type] = [];
        }
        this.handlers[type].push(listener);
    };
    EventListenerManager.prototype.removeEventListener = function (type, listener) {
        var idx = this.handlers[type].indexOf(listener);
        if (idx >= 0) {
            this.handlers[type].splice(idx, 1);
        }
    };
    EventListenerManager.prototype.emitEvent = function (type, payload) {
        for (var _i = 0, _a = this.handlers[type]; _i < _a.length; _i++) {
            var handler = _a[_i];
            handler(payload);
        }
    };
    return EventListenerManager;
}());
export { EventListenerManager };
