import type { AgChartsExports } from '../../../../../agChartsExports';
import type { MiniChartSelector, ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniStackedBarClass } from './miniStackedBar';
export declare class MiniNormalizedBarClass extends MiniStackedBarClass {
    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[], themeTemplateParameters: ThemeTemplateParameters, isCustomTheme: boolean);
}
export declare const MiniNormalizedBar: MiniChartSelector;
