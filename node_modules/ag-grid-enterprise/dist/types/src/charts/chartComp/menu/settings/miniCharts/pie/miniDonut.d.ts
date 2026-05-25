import type { AgChartsExports } from '../../../../../agChartsExports';
import type { ChartTranslationKey } from '../../../../services/chartTranslationService';
import type { MiniChartSelector, ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniChart } from '../miniChart';
export declare class MiniDonutClass extends MiniChart {
    private readonly sectors;
    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[], _themeTemplateParameters: ThemeTemplateParameters, _isCustomTheme: boolean, centerRadiusScaler?: number, tooltipName?: ChartTranslationKey);
    updateColors(fills: string[], strokes: string[]): void;
}
export declare const MiniDonut: MiniChartSelector;
