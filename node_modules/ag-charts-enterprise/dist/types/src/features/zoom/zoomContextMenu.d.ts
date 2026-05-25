import type { _ModuleSupport } from 'ag-charts-community';
import type { DefinedZoomState, ZoomProperties } from './zoomTypes';
export declare class ZoomContextMenu {
    private readonly contextMenuRegistry;
    private readonly zoomManager;
    private readonly getModuleProperties;
    private readonly getRect;
    private readonly updateZoom;
    private readonly isZoomValid;
    constructor(contextMenuRegistry: _ModuleSupport.ContextMenuRegistry, zoomManager: _ModuleSupport.ZoomManager, getModuleProperties: () => ZoomProperties, getRect: () => _ModuleSupport.BBox | undefined, updateZoom: (zoom: DefinedZoomState) => void, isZoomValid: (zoom: DefinedZoomState) => boolean);
    registerActions(enabled: boolean | undefined): (() => void) | undefined;
    private computeOrigin;
    private onZoomToHere;
    private onPanToHere;
    private iterateFindNextZoomAtPoint;
    private getNextZoomAtPoint;
}
