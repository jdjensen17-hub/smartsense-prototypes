import { useMemo } from 'react';
import { createDefaultRenderers } from './createDefaultRenderers';
export var useRenderers = function (_a) {
    var renderItem = _a.renderItem, renderItemTitle = _a.renderItemTitle, renderItemArrow = _a.renderItemArrow, renderRenameInput = _a.renderRenameInput, renderItemsContainer = _a.renderItemsContainer, renderTreeContainer = _a.renderTreeContainer, renderDragBetweenLine = _a.renderDragBetweenLine, renderSearchInput = _a.renderSearchInput, renderLiveDescriptorContainer = _a.renderLiveDescriptorContainer, renderDepthOffset = _a.renderDepthOffset;
    var defaultRenderers = useMemo(function () { return createDefaultRenderers(renderDepthOffset !== null && renderDepthOffset !== void 0 ? renderDepthOffset : 10); }, [renderDepthOffset]);
    var customRenderers = {
        renderItem: renderItem,
        renderItemTitle: renderItemTitle,
        renderItemArrow: renderItemArrow,
        renderRenameInput: renderRenameInput,
        renderItemsContainer: renderItemsContainer,
        renderTreeContainer: renderTreeContainer,
        renderDragBetweenLine: renderDragBetweenLine,
        renderSearchInput: renderSearchInput,
        renderLiveDescriptorContainer: renderLiveDescriptorContainer,
        renderDepthOffset: renderDepthOffset,
    };
    var renderers = Object.entries(defaultRenderers).reduce(function (acc, _a) {
        var key = _a[0], value = _a[1];
        var keyMapped = key;
        if (customRenderers[keyMapped]) {
            acc[keyMapped] = customRenderers[keyMapped];
        }
        else {
            acc[keyMapped] = value;
        }
        return acc;
    }, {});
    renderers.renderItem.displayName = 'RenderItem';
    renderers.renderItemTitle.displayName = 'RenderItemTitle';
    renderers.renderItemArrow.displayName = 'RenderItemArrow';
    renderers.renderRenameInput.displayName = 'RenderRenameInput';
    renderers.renderItemsContainer.displayName = 'RenderItemsContainer';
    renderers.renderTreeContainer.displayName = 'RenderTreeContainer';
    renderers.renderDragBetweenLine.displayName =
        'RenderDragBetweenLine';
    renderers.renderSearchInput.displayName = 'RenderSearchInput';
    return renderers;
};
