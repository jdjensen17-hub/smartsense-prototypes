import type { AgChartsExports } from '../../../../../agChartsExports';
import type { ChartTranslationKey } from '../../../../services/chartTranslationService';
import type { MiniChartSelector, ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniStackedAreaClass } from './miniStackedArea';
export declare const miniNormalizedAreaData: number[][];
export declare class MiniNormalizedAreaClass extends MiniStackedAreaClass {
    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[], themeTemplateParameters: ThemeTemplateParameters, isCustomTheme: boolean, data?: number[][], tooltipName?: ChartTranslationKey);
}
export declare const MiniNormalizedArea: MiniChartSelector;
