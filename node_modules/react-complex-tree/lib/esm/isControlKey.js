export var isControlKey = function (e) {
    return e.ctrlKey ||
        (navigator.platform.toUpperCase().indexOf('MAC') >= 0 && e.metaKey);
};
