import type { AgChartsExports } from '../../../../../agChartsExports';
import type { ChartTranslationKey } from '../../../../services/chartTranslationService';
import type { MiniChartSelector, ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniLineClass } from './miniLine';
export declare const miniStackedLineData: number[][];
export declare class MiniStackedLineClass extends MiniLineClass {
    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[], _themeTemplateParameters: ThemeTemplateParameters, _isCustomTheme: boolean, data?: number[][], tooltipName?: ChartTranslationKey);
}
export declare const MiniStackedLine: MiniChartSelector;
