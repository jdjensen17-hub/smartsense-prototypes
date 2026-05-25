import type { AgChartsExports } from '../../../../../agChartsExports';
import type { MiniChartSelector, ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniChartWithAxes } from '../miniChartWithAxes';
export declare class MiniBoxPlotClass extends MiniChartWithAxes {
    private readonly boxPlotGroups;
    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[], themeTemplateParameters: ThemeTemplateParameters, isCustomTheme: boolean);
    updateColors(fills: string[], strokes: string[], themeTemplateParameters?: ThemeTemplateParameters, isCustomTheme?: boolean): void;
    setLineProperties(line: any, x1: number, x2: number, y1: number, y2: number): void;
}
export declare const MiniBoxPlot: MiniChartSelector;
