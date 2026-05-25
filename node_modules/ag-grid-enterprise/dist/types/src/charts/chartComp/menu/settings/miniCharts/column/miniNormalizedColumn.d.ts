import type { AgChartsExports } from '../../../../../agChartsExports';
import type { MiniChartSelector, ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniStackedColumnClass } from './miniStackedColumn';
export declare const miniNormalizedColumnData: number[][];
export declare class MiniNormalizedColumnClass extends MiniStackedColumnClass {
    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[], themeTemplateParameters: ThemeTemplateParameters, isCustomTheme: boolean);
}
export declare const MiniNormalizedColumn: MiniChartSelector;
