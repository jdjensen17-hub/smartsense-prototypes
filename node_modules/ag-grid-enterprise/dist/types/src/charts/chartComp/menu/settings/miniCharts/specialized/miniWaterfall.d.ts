import type { AgChartsExports } from '../../../../../agChartsExports';
import type { MiniChartSelector, ThemeTemplateParameters } from '../../miniChartsContainer';
import { MiniChartWithAxes } from '../miniChartWithAxes';
export declare class MiniWaterfallClass extends MiniChartWithAxes {
    private readonly bars;
    private data;
    constructor(container: HTMLElement, agChartsExports: AgChartsExports, fills: string[], strokes: string[], themeTemplate: ThemeTemplateParameters, isCustomTheme: boolean);
    updateColors(fills: string[], strokes: string[], themeTemplate?: ThemeTemplateParameters, isCustomTheme?: boolean): void;
    createWaterfall(root: any, data: number[], size: number, padding: number, direction: 'horizontal' | 'vertical'): {
        bars: any[];
    };
}
export declare const MiniWaterfall: MiniChartSelector;
