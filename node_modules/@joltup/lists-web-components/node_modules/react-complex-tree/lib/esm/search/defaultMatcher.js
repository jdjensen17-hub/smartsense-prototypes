export var defaultMatcher = function (search, item, itemTitle) {
    return itemTitle.toLowerCase().includes(search.toLowerCase());
};
