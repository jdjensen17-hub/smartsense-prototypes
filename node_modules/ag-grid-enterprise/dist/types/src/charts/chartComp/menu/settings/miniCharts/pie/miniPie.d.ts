import type { AgChartsExports } from '../../../../../agChartsExports';
import type { MiniChartSelector, ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniDonutClass } from './miniDonut';
export declare class MiniPieClass extends MiniDonutClass {
    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[], themeTemplateParameters: ThemeTemplateParameters, isCustomTheme: boolean);
}
export declare const MiniPie: MiniChartSelector;
